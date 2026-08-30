# SOP — Generate Test Plan (LLM)

## Purpose
Use an LLM (Ollama) to generate structured test cases from acceptance criteria.

## Inputs
- `issue_key`: Jira key (for plan ID).
- `summary`: Issue summary (for plan metadata).
- `acceptance_criteria`: list[str] parsed from the Jira issue.

## Logic
1. If criteria is empty → raise `ValueError`.
2. Build prompt with numbered criteria.
3. Call Ollama chat API (`POST {OLLAMA_URL}/api/chat`).
4. Parse JSON response — extract `test_cases` array.
5. Validate each item: `criterion_ref`, `description`, `steps`, `expected_result`, `priority`.
6. Assign sequential IDs `TC-001`, `TC-002`, etc.

## Anti-Hallucination Rules
- Each test case must map to exactly one acceptance criterion (`criterion_ref`).
- No features beyond what's in the criteria.
- If criterion is ambiguous, test case should state "Insufficient information" in expected_result.
- Self-check: every `steps` entry is actionable and verifiable.

## Output
`TestPlan` dataclass with `to_markdown()` and `to_json()` serializers.

## Edge Cases
- LLM returns markdown-wrapped JSON (` ```json `) → strip fences.
- LLM returns invalid JSON → raise `RuntimeError`.
- Missing fields in items → use defaults (priority="Medium").
