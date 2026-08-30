# Task Plan — Test Plan Creator from Jira ID

**Protocol:** B.L.A.S.T. Protocol 0 (Initialization)
**North Star:** Create a deterministic test plan creator that takes a Jira issue ID and outputs a structured test plan.

## Phases

### Phase 1: B — Blueprint (Vision & Logic)
- [x] Create `task_plan.md`
- [x] Create `findings.md`
- [x] Create `progress.md`
- [x] Create `gemini.md` (Project Constitution)
- [x] Create `LLM.md`
- [ ] Answer the 5 Discovery Questions (see `gemini.md`)
- [ ] Define JSON Data Schema in `gemini.md`
- [ ] Get Blueprint approved before writing code

### Phase 2: L — Link (Connectivity)
- [ ] Verify Jira Cloud credentials in `.env`
- [ ] Test `GET /rest/api/3/issue/{key}` via curl
- [ ] Build `tools/jira_fetch.py` handshake script
- [ ] Verify LLM provider connection (Ollama)

### Phase 3: A — Architect (3-Layer Build)
- [ ] Layer 1: Write SOPs in `architecture/`
- [ ] Layer 2: Navigation logic — route data between SOPs and tools
- [ ] Layer 3: Write deterministic Python tools in `tools/`
  - `tools/jira_fetch.py` — fetch issue from Jira
  - `tools/extract_acceptance_criteria.py` — parse ADF description
  - `tools/generate_test_plan.py` — LLM-powered test plan generation
  - `tools/deliver_test_plan.py` — output to Markdown/JSON

### Phase 4: S — Stylize (Refinement & UI)
- [ ] Format test plan output (Markdown with tables)
- [ ] Add progress tracking in `progress.md`
- [ ] Present to user for feedback

## Goals

1. Accept a Jira issue key (e.g., `PROJ-123`) as CLI input
2. Fetch the issue via Jira REST API v3
3. Extract summary, description, and acceptance criteria
4. Generate a structured test plan (test cases grouped by criteria)
5. Deliver the test plan as Markdown to console and/or file

## Discovery Questions

1. **North Star:** Produce a structured test plan from any Jira issue ID.
2. **Integrations:** Jira Cloud REST API (v3); Ollama LLM for test plan generation.
3. **Source of Truth:** Jira issue is the primary data source.
4. **Delivery Payload:** Markdown test plan, printed to console and saved to `.tmp/output.md`.
5. **Behavioral Rules:** Deterministic output; fail fast on missing data; never hallucinate acceptance criteria.

## Checklists

- [x] Project directory initialized
- [x] Pyrefly configured (`pyrefly.toml`)
- [x] Project Constitution (`gemini.md`) drafted
- [ ] Data schema confirmed in `gemini.md`
- [ ] `.env` file created with Jira credentials
- [ ] Jira API tested with curl
- [ ] Handshake scripts built and verified
- [ ] First deterministic tool implemented
