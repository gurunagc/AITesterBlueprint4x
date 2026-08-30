# LLM.md — Architecture Thoughts, Schemas, and Rules

## Overview

This project creates a **test plan from a Jira issue ID** using a deterministic pipeline with optional LLM-powered test case generation. The architecture follows the B.L.A.S.T. protocol and A.N.T. 3-layer pattern.

## Architecture Thoughts

### 3-Layer Separation (A.N.T. Architecture)

- **Layer 1 — Architecture (`architecture/`):** Technical SOPs written in Markdown. Defines goals, inputs, tool logic, and edge cases. The Golden Rule: update the SOP before changing code.
- **Layer 2 — Navigation:** Reasoning/orchestration layer. Routes data between SOPs and tools. Decides ordering and handles failures. Contains no business logic itself.
- **Layer 3 — Tools (`tools/`):** Deterministic, atomic, testable Python scripts. Each tool does one thing well. All use type annotations enforced by Pyrefly.

### Data Flow

```
Jira Issue Key (CLI input)
        ↓
tools/jira_fetch.py          → Fetches raw Jira issue JSON (REST API v3)
        ↓
tools/parse_issue.py         → Parses ADF → extracts summary, description, acceptance criteria
        ↓
tools/generate_test_plan.py  → LLM (Ollama) generates test cases from acceptance criteria
        ↓
tools/deliver_test_plan.py   → Outputs Markdown + JSON to .tmp/ and console
```

### Why This Structure

- **Reliability over speed:** Each tool is independently testable. If one fails, the pipeline halts gracefully.
- **Determinism where possible:** ADF parsing and acceptance criteria extraction are regex-based (no LLM hallucination risk).
- **LLM only for creative step:** Test case generation is the only probabilistic step, and each generated case is traceable to a specific acceptance criterion.
- **Type safety:** Pyrefly enforces type annotations across all Python modules, catching errors before runtime.

## Schemas

### Input
```json
{"jira_issue_key": "PROJ-123"}
```

### Parsed Issue (post-extraction)
```json
{
  "key": "PROJ-123",
  "summary": "string",
  "description": "string (plain text)",
  "acceptance_criteria": ["string", "..."],
  "issue_type": "string",
  "labels": ["string"]
}
```

### Test Plan Output
```json
{
  "test_plan_id": "string",
  "source_issue_key": "string",
  "generated_at": "ISO timestamp",
  "test_cases": [
    {
      "id": "TC-001",
      "criterion_ref": 0,
      "description": "string",
      "steps": ["step 1", "step 2"],
      "expected_result": "string",
      "priority": "High|Medium|Low"
    }
  ]
}
```

Key design decisions:
- `criterion_ref` links each test case to an acceptance criterion by index — enables coverage tracking
- Timestamps are ISO 8601 UTC for reproducibility
- Output saved as both Markdown (human-readable) and JSON (machine-readable)

## Rules

### Anti-Hallucination Rules (from chapter_01_LLMBASICS/ANTI-HALLUCINATION.rules.md)

1. **Verified Facts Only:** Every assertion in the test plan must be traceable to an acceptance criterion from the Jira issue.
2. **Missing Information:** If an acceptance criterion is ambiguous, flag it as "Insufficient information to determine" rather than guessing.
3. **Self-Validation:** After generating test cases, run a self-check: does each step follow logically from the criterion? Are expected results verifiable?
4. **No Invented Features:** Do not add test cases for functionality not mentioned in the Jira issue.
5. **Deterministic Output:** Given the same Jira issue input, the non-LLM steps (fetch, parse, extract) produce identical output every time.

### Behavioral Rules (from gemini.md)

1. **Fail Fast:** 401/404 from Jira → raise `JiraError`, halt.
2. **Secret Hygiene:** Credentials from `.env`, never hardcoded.
3. **Atomic Tools:** Each `tools/*.py` script is independently runnable and testable.
4. **Type Enforcement:** All Python uses type annotations; Pyrefly checks in CI.
5. **Temp Isolation:** All intermediate files go in `.tmp/`.

## Pyrefly Config

`pyrefly.toml` initialized with default settings:
```toml
project-includes = ["**/*.py*", "**/*.ipynb"]
```
No Python files exist yet (Protocol 0). Type checking will begin once `tools/` scripts are written.
