#!/usr/bin/env python
"""Test Plan Creator from Jira ID.

Usage:
    python main.py <JIRA_ISSUE_KEY>

Fetches a Jira issue, extracts acceptance criteria, generates a structured
test plan via LLM, and delivers Markdown + JSON to .tmp/.
"""
from __future__ import annotations

import sys

from tools.deliver_test_plan import deliver
from tools.generate_test_plan import generate_test_plan
from tools.jira_fetch import JiraConfig, JiraError, fetch_issue
from tools.parse_issue import parse_issue


def run(issue_key: str) -> int:
    """End-to-end pipeline: fetch → parse → generate → deliver.

    Args:
        issue_key: Jira issue key (e.g. ``MYC-1``).

    Returns:
        0 on success, 1 on error.
    """
    try:
        config = JiraConfig.from_env()
    except JiraError as exc:
        print(f"[Link] Configuration error: {exc}")
        return 1

    try:
        raw = fetch_issue(issue_key, config)
    except JiraError as exc:
        print(f"[Link] Jira fetch error: {exc}")
        return 1

    issue = parse_issue(raw)
    print(f"[Parse] Key:      {issue.key}")
    print(f"[Parse] Summary:  {issue.summary}")
    print(f"[Parse] Type:     {issue.issue_type}")
    print(f"[Parse] Labels:   {issue.labels}")
    print(f"[Parse] Criteria: {len(issue.acceptance_criteria)} found")

    if not issue.acceptance_criteria:
        print("[Parse] No acceptance criteria found — cannot generate test plan.")
        return 1

    print("[Generate] Calling LLM (Ollama)...")
    try:
        plan = generate_test_plan(
            issue_key=issue.key,
            summary=issue.summary,
            acceptance_criteria=issue.acceptance_criteria,
        )
    except (RuntimeError, ValueError) as exc:
        print(f"[Generate] LLM generation error: {exc}")
        return 1

    print(f"[Deliver] Plan ID: {plan.test_plan_id}")
    print(f"[Deliver] Test cases: {len(plan.test_cases)}")
    print(f"[Deliver] Coverage: {plan.coverage['criteria_covered']}/{plan.coverage['total_acceptance_criteria']} criteria")

    paths = deliver(plan)
    print(f"[Deliver] Markdown: {paths['markdown']}")
    print(f"[Deliver] JSON:     {paths['json']}")
    print("\nDone!")
    return 0


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python main.py <JIRA_ISSUE_KEY>")
        sys.exit(1)
    sys.exit(run(sys.argv[1]))


if __name__ == "__main__":
    main()
