"""Parse a raw Jira issue JSON into a structured, typed object.

Extracts summary, description (plain text from ADF), and acceptance criteria.
Deterministic — no LLM involved.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

# Headings that indicate acceptance criteria or functional requirements.
# Matches both markdown-style (h2., ##, **, >) and plain-text heading lines.
_CRITERIA_HEADING_RE = re.compile(
    r"(?:^|\n)[ \t]*(?:Acceptance\s*Criteria|Functional\s*Requirements|Requirements)\s*[:\-]?",
    re.IGNORECASE,
)
_NEXT_HEADING_RE = re.compile(r"\n[ \t]*\*\*[A-Z]")
_BULLET_LINE_RE = re.compile(r"^-\s+(.+)")


@dataclass
class ParsedIssue:
    """Structured representation of a Jira issue."""

    key: str
    summary: str
    description: str
    acceptance_criteria: list[str]
    issue_type: str
    labels: list[str] = field(default_factory=list)


def _extract_text(node: Any) -> str:
    """Recursively pull text out of Atlassian Document Format (ADF) nodes.

    Preserves structure by inserting newlines after headings, paragraphs,
    and list items so downstream parsers can split on line boundaries.
    """
    if node is None:
        return ""
    if isinstance(node, str):
        return node
    if isinstance(node, dict):
        ntype = node.get("type", "")
        if ntype == "text":
            return node.get("text", "")
        if ntype in ("heading", "paragraph"):
            inner = _join_children(node.get("content"))
            return inner + "\n"
        if ntype == "listItem":
            inner = _join_children(node.get("content"))
            return "- " + inner.strip() + "\n"
        if ntype in ("bulletList", "orderedList", "doc", "table", "tableRow", "tableCell"):
            return _join_children(node.get("content"), sep="\n")
        # Generic dict: recurse into content
        return _join_children(node.get("content"))
    if isinstance(node, list):
        return _join_children(node, sep="\n")
    return str(node)


def _join_children(content: Any, sep: str = "") -> str:
    """Join text extracted from a list of child nodes."""
    if not isinstance(content, list):
        return _extract_text(content)
    parts = [_extract_text(c) for c in content]
    if sep:
        return sep.join(parts)
    # Collapse empty strings and join
    non_empty = [p for p in parts if p]
    return "".join(non_empty)


def parse_description(raw: Any) -> str:
    """Convert ADF description (or plain text) to a single string."""
    return _extract_text(raw) if raw is not None else ""


def _split_bullets(text: str) -> list[str]:
    """Extract bulleted items (lines starting with ``- ``) from text."""
    criteria: list[str] = []
    for line in text.split("\n"):
        m = _BULLET_LINE_RE.match(line.strip())
        if m:
            item = m.group(1).strip()
            if len(item) > 5:
                criteria.append(item)
    return criteria


def extract_acceptance_criteria(text: str) -> list[str]:
    """Extract acceptance criteria from parsed description text.

    1. Looks for a heading containing 'Acceptance Criteria' / 'Functional
       Requirements' / 'Requirements' and returns the bullet/numbered items
       that follow (up to the next heading).
    2. If no such heading is found, falls back to extracting all bulleted items
       from the entire description.
    """
    match = _CRITERIA_HEADING_RE.search(text)
    if match:
        rest = text[match.end():]
        nxt = _NEXT_HEADING_RE.search(rest)
        if nxt:
            rest = rest[: nxt.start()]

        criteria = _split_bullets(rest)
        if criteria:
            return criteria
        return [rest.strip()] if rest.strip() else []

    # Fallback: extract all bulleted functional requirements from the text.
    criteria = _split_bullets(text)
    return criteria


def parse_issue(data: dict[str, Any]) -> ParsedIssue:
    """Parse raw Jira API response into :class:`ParsedIssue`.

    Args:
        data: Raw JSON dict from ``fetch_issue``.

    Returns:
        ParsedIssue with summary, description, and acceptance criteria.
    """
    fields = data.get("fields", {})
    raw_desc = fields.get("description", "")
    description_text = parse_description(raw_desc)

    issue_type_raw = fields.get("issuetype", {})
    issue_type = (
        issue_type_raw.get("name", "") if isinstance(issue_type_raw, dict) else ""
    )

    labels_raw = fields.get("labels", [])
    labels: list[str] = []
    if isinstance(labels_raw, list):
        labels = [str(lbl) for lbl in labels_raw]

    return ParsedIssue(
        key=data.get("key", ""),
        summary=fields.get("summary", ""),
        description=description_text,
        acceptance_criteria=extract_acceptance_criteria(description_text),
        issue_type=issue_type,
        labels=labels,
    )
