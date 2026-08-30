# SOP — Navigation Layer (Orchestration)

## Purpose
Layer 2 — route calls between tools in correct order, handle failures.

## Pipeline
```
main.run(issue_key)
  ├─ JiraConfig.from_env()          → loads .env
  ├─ fetch_issue(key, config)       → Layer 3: tools/jira_fetch.py
  ├─ parse_issue(raw)               → Layer 3: tools/parse_issue.py
  ├─ generate_test_plan(...)        → Layer 3: tools/generate_test_plan.py
  └─ deliver(plan)                  → Layer 3: tools/deliver_test_plan.py
```

## Failure Handling
- Config error → print + return 1.
- Jira fetch error → print + return 1.
- No acceptance criteria → print + return 1.
- LLM error → print + return 1.
- Delivery success → print paths + return 0.

## Invariants
- No business logic in navigation layer.
- Each tool call is atomic and independently testable.
- Fail fast — halt on first error.
