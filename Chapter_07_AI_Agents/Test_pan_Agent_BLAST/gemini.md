# Project Constitution — gemini.md

**Project:** Test Plan Creator from Jira ID
**Protocol:** B.L.A.S.T. Protocol 0
**Pyrefly Initialized:** Yes (`pyrefly.toml`)

---

## Data Schemas (JSON)

### Input Schema
```json
{
  "jira_issue_key": "PROJ-123",
  "options": {
    "include_labels": true,
    "include_changelog": false
  }
}
```

### Parsed Issue Schema
```json
{
  "key": "PROJ-123",
  "summary": "User can reset password via email link",
  "description": "As a user, I want to reset my password...",
  "acceptance_criteria": [
    "An email is sent to the user",
    "The email contains a valid reset link"
  ],
  "issue_type": "Story",
  "labels": ["auth", "password-reset"]
}
```

### Test Plan Output Schema
```json
{
  "test_plan_id": "PROJ-123-TP-20260830",
  "source_issue_key": "PROJ-123",
  "source_issue_summary": "User can reset password via email link",
  "generated_at": "2026-08-30T12:00:00Z",
  "test_cases": [
    {
      "id": "TC-001",
      "criterion_ref": 0,
      "description": "Verify reset email is sent after form submission",
      "steps": [
        "Navigate to /forgot-password",
        "Enter valid email address",
        "Click 'Send Reset Link'",
        "Check email inbox"
      ],
      "expected_result": "User receives email with valid reset link",
      "priority": "High"
    }
  ],
  "coverage": {
    "total_acceptance_criteria": 2,
    "total_test_cases": 2,
    "criteria_covered": 2
  }
}
```

---

## Behavioral Rules

1. **Deterministic First:** Acceptance criteria extraction is deterministic (regex-based). Only test case generation uses LLM.
2. **No Hallucination:** Test cases must be traceable to an acceptance criterion. Never invent features not present in the Jira issue.
3. **Fail Fast:** If Jira returns 401/404, raise `JiraError` immediately. Do not proceed.
4. **Secret Hygiene:** Jira API token and email read from `.env`. Never hardcode. `.env` in `.gitignore`.
5. **Self-Validation:** Every generated test case is validated against the `ANTI-HALLUCINATION.rules.md` QA checklist.

## Architectural Invariants (A.N.T. 3-Layer)

- **Layer 1 (Architecture):** SOPs in `architecture/` — written before code. Golden Rule: update SOP before code.
- **Layer 2 (Navigation):** Orchestrates calls to Layer 3 tools in correct order. No business logic here.
- **Layer 3 (Tools):** Deterministic, atomic, testable Python scripts in `tools/`. All use type annotations (Pyrefly enforces).
- **Data Flow:** Jira API → `parse_description` → `extract_acceptance_criteria` → LLM generates test cases → output Markdown/JSON.

## Discovery Answers

1. **North Star:** Produce a structured test plan from any Jira issue ID.
2. **Integrations:** Jira Cloud REST API v3 (email + API token auth); Ollama (`gemma4:26b`) for LLM-based test case generation.
3. **Source of Truth:** The Jira issue specified by the user-provided key.
4. **Delivery Payload:** Markdown test plan + JSON summary, saved to `.tmp/output.md` and `.tmp/output.json`, printed to console.
5. **Behavioral Rules:** Deterministic parsing; no hallucination; fail fast on auth/API errors; secrets in `.env`; Pyrefly type-checked.
