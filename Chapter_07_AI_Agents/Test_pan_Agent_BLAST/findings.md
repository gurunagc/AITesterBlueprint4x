# Findings — Test Plan Creator from Jira ID

## Research: Jira REST API v3

### Authentication
- **Method:** HTTP Basic Auth
- **Credentials:** Email + API token
- **Header:** `Authorization: Basic <base64(email:api_token)>`
- **Source of Truth:** `chapter_03_Local_TC_Generator/settings.json` contains valid Jira credentials for `gurunagc1.atlassian.net`

### API Endpoints

#### 1. Fetch Single Issue
```
GET https://gurunagc1.atlassian.net/rest/api/3/issue/{ISSUE_KEY}?fields=summary,description,issuetype,labels
```
- Returns JSON with `fields.summary`, `fields.description` (Atlassian Document Format v2), `fields.issuetype`
- API v3 uses ADF for description; API v2 returns plain text

#### 2. Search Issues (for epics/stories)
```
GET https://gurunagc1.atlassian.net/rest/api/3/search?jql=parent={ISSUE_KEY}&fields=summary,description
```

#### 3. Fetch Issue Changelog
```
GET https://gurunagc1.atlassian.net/rest/api/3/issue/{ISSUE_KEY}?fields=changelog
```

### curl Examples

#### Fetch a Jira issue (replace ISSUE_KEY):
```bash
curl -u "gurunagc1@gmail.com:YOUR_API_TOKEN" \
  "https://gurunagc1.atlassian.net/rest/api/3/issue/PROJ-123?fields=summary,description,issuetype,labels" \
  -H "Accept: application/json"
```

#### Fetch issue with changelog:
```bash
curl -u "gurunagc1@gmail.com:YOUR_API_TOKEN" \
  "https://gurunagc1.atlassian.net/rest/api/3/issue/PROJ-123?fields=summary,description,issuetype,changelog" \
  -H "Accept: application/json"
```

### Atlassian Document Format (ADF) Parsing

- Description returned in ADF (JSON): `{"type": "doc", "content": [{"type": "heading", ...}, {"type": "paragraph", ...}, ...]}`
- Need to walk `content` array recursively to extract text
- Acceptance criteria typically found under a heading containing "Acceptance Criteria" or "AC"
- Existing parser in `chapter_03_Local_TC_Generator/jira_client.py` (`_extract_text`, `parse_description`, `extract_acceptance_criteria`) can be reused as reference

### LLM Provider: Ollama
- URL: `http://localhost:11434`
- Model: `gemma4:26b` (from settings.json)
- API: `POST http://localhost:11434/api/chat` with JSON body `{"model": "gemma:4:26b", "messages": [...]}`

### Constraints & Gotchas
- Jira Cloud API rate limit: 1000 requests/minute
- API token must be kept secret (`.env`, never committed)
- ADF structure varies — parser must be robust to missing `content` keys
- Ollama must be running locally for LLM-based generation

## Discoveries from Sibling Projects

- `chapter_03_Local_TC_Generator/` already has a working `jira_client.py` — can reuse patterns
- `chapter_01_LLMBASICS/ANTI-HALLUCINATION.rules.md` defines QA verification rules we should follow
- No existing pytest test infrastructure anywhere in the repo — will need to set up
- Pyrefly type checking now configured at `pyrefly.toml` in this project directory
