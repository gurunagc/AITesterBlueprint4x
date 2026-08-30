"""Generate a structured test plan from a parsed Jira issue.

Uses an LLM (Ollama) to create test cases that map to acceptance criteria.
LLM output is post-processed to ensure it conforms to the schema.
"""
from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

import requests
from dotenv import load_dotenv
from requests.exceptions import ReadTimeout, RequestException


@dataclass
class TestCase:
    """A single test case in the generated test plan."""

    id: str
    criterion_ref: int
    description: str
    steps: list[str]
    expected_result: str
    priority: str


@dataclass
class TestPlan:
    """Complete test plan output."""

    test_plan_id: str
    source_issue_key: str
    source_issue_summary: str
    generated_at: str
    test_cases: list[TestCase]
    coverage: dict[str, int] = field(default_factory=dict)


_PROMPT_TEMPLATE = """You are a QA test plan generator. Your job is to produce structured JSON only.

You are given a Jira issue with acceptance criteria. For EACH acceptance criterion, generate exactly ONE test case. Each test case must directly verify the criterion. Do NOT invent features not present in the criteria.

Return ONLY valid JSON in this exact format:
{
  "test_cases": [
    {
      "criterion_ref": 0,
      "description": "brief description of what is tested",
      "steps": ["step 1", "step 2", "step 3"],
      "expected_result": "what should happen",
      "priority": "High"
    }
  ]
}

Acceptance Criteria:
###CRITERIA###

JSON output:"""


def _get_ollama_url() -> str:
    load_dotenv()
    base = os.getenv("OLLAMA_URL", "http://localhost:11434")
    return f"{base.rstrip('/')}/api/chat"


def _get_ollama_model() -> str:
    load_dotenv()
    return os.getenv("OLLAMA_MODEL", "gemma:2b")


def _get_groq_config() -> tuple[str, str] | None:
    """Return (api_key, model) for Groq, or None if not configured."""
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY", "")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    if not api_key:
        return None
    return api_key, model


def _call_ollama(prompt: str) -> str:
    """Call Ollama chat API and return the raw response text."""
    payload: dict[str, Any] = {
        "model": _get_ollama_model(),
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
    }
    resp = requests.post(
        _get_ollama_url(),
        json=payload,
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Ollama returned HTTP {resp.status_code}: {resp.text[:300]}")

    data = resp.json()
    message = data.get("message", {})
    content = message.get("content", "")
    if not content:
        raise RuntimeError("Ollama returned an empty response.")
    return content.strip()


def _call_groq(prompt: str) -> str:
    """Call Groq chat completions API and return the raw response text."""
    config = _get_groq_config()
    if config is None:
        raise RuntimeError("Groq API key not configured in .env")
    api_key, model = config

    payload: dict[str, Any] = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
    }
    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        json=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Groq returned HTTP {resp.status_code}: {resp.text[:300]}")

    data = resp.json()
    choices = data.get("choices", [])
    if not choices:
        raise RuntimeError("Groq returned no choices.")
    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise RuntimeError("Groq returned an empty response.")
    return content.strip()


def _call_llm(prompt: str) -> str:
    """Call Ollama first; fall back to Groq on connection timeout."""
    try:
        return _call_ollama(prompt)
    except ReadTimeout:
        print("[LLM] Ollama timed out — falling back to Groq.", flush=True)
    except RequestException:
        print("[LLM] Ollama unreachable — falling back to Groq.", flush=True)

    return _call_groq(prompt)


def _parse_llm_output(raw: str, num_criteria: int) -> list[TestCase]:
    """Parse LLM JSON output into TestCase list with validation."""
    raw = raw.strip()
    # Strip markdown code fences if present
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"LLM returned invalid JSON: {exc}") from exc

    items = parsed.get("test_cases", [])
    if not isinstance(items, list):
        raise RuntimeError("LLM output 'test_cases' is not a list.")

    cases: list[TestCase] = []
    tc_counter = 1
    for idx, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        crit_ref = item.get("criterion_ref", idx)
        if not isinstance(crit_ref, int):
            crit_ref = idx
        case = TestCase(
            id=f"TC-{tc_counter:03d}",
            criterion_ref=crit_ref,
            description=item.get("description", ""),
            steps=item.get("steps", []),
            expected_result=item.get("expected_result", ""),
            priority=item.get("priority", "Medium"),
        )
        cases.append(case)
        tc_counter += 1

    return cases


def generate_test_plan(
    issue_key: str,
    summary: str,
    acceptance_criteria: list[str],
) -> TestPlan:
    """Generate a full test plan from a Jira issue's acceptance criteria.

    Args:
        issue_key: Jira issue key (e.g. ``MYC-1``).
        summary: Issue summary / title.
        acceptance_criteria: List of acceptance criteria strings.

    Returns:
        :class:`TestPlan` with test cases and coverage stats.
    """
    if not acceptance_criteria:
        raise ValueError("No acceptance criteria provided — cannot generate test plan.")

    # Number the criteria for the LLM prompt
    criteria_lines = "\n".join(
        f"  {i}. {criterion}"
        for i, criterion in enumerate(acceptance_criteria)
    )
    prompt = _PROMPT_TEMPLATE.replace("###CRITERIA###", criteria_lines)

    raw_output = _call_llm(prompt)
    cases = _parse_llm_output(raw_output, len(acceptance_criteria))

    covered_criteria: set[int] = {c.criterion_ref for c in cases}
    coverage = {
        "total_acceptance_criteria": len(acceptance_criteria),
        "total_test_cases": len(cases),
        "criteria_covered": len(covered_criteria),
    }

    return TestPlan(
        test_plan_id=f"{issue_key}-TP-{datetime.now(timezone.utc).strftime('%Y%m%d')}",
        source_issue_key=issue_key,
        source_issue_summary=summary,
        generated_at=datetime.now(timezone.utc).isoformat(),
        test_cases=cases,
        coverage=coverage,
    )


def to_markdown(plan: TestPlan) -> str:
    """Render a test plan as Markdown."""
    lines: list[str] = []
    lines.append(f"# Test Plan: {plan.source_issue_key}")
    lines.append(f"\n**Issue:** {plan.source_issue_summary}")
    lines.append(f"\n**Generated:** {plan.generated_at}")
    lines.append(f"\n## Coverage\n")
    lines.append(f"- Total acceptance criteria: {plan.coverage['total_acceptance_criteria']}")
    lines.append(f"- Test cases generated: {plan.coverage['total_test_cases']}")
    lines.append(f"- Criteria covered: {plan.coverage['criteria_covered']}")
    lines.append(f"\n## Test Cases\n")

    for tc in plan.test_cases:
        lines.append(f"\n### {tc.id} — {tc.description}")
        lines.append(f"**Priority:** {tc.priority} | **Criterion ref:** #{tc.criterion_ref}")
        lines.append(f"\n**Steps:**")
        for step in tc.steps:
            lines.append(f"  {step}")
        lines.append(f"\n**Expected result:** {tc.expected_result}")

    return "\n".join(lines)


def to_json(plan: TestPlan) -> str:
    """Serialize a test plan to pretty-printed JSON."""
    return json.dumps(asdict(plan), indent=2)
