# SOP — Parse Issue (ADF → Structured Data)

## Purpose
Parse raw Jira JSON into a `ParsedIssue` dataclass with plain-text description
and extracted acceptance criteria.

## Inputs
- `data`: Raw dict from `fetch_issue()`.

## Logic
1. Extract `fields.summary`, `fields.issuetype.name`, `fields.labels`.
2. Parse `fields.description` via ADF recursive text extraction (`_extract_text`).
3. Search description for "Acceptance Criteria" heading (regex).
4. If found, extract bullet/numbered list items following the heading.
5. If not found, return empty list (caller handles gracefully).

## ACF Parsing Details
- Regex: `(?:\n|^)\s*(?:h2\.|\##|\*\*|\>\s*)\s*Acceptance\s*Criteria\s*[:\-]?`
- Stop at next heading: `\n(?:h2\.|\##|\*\*[A-Z])`
- Each line after heading: strip bullet/numbered prefixes, collect non-empty items.

## Output
`ParsedIssue(key, summary, description, acceptance_criteria, issue_type, labels)`

## Edge Cases
- Description is `None` → empty string.
- Description is plain string (API v2) → return as-is.
- No "Acceptance Criteria" heading → return `[]`.
- Malformed ADF → recursive descent handles gracefully (empty strings for missing nodes).
