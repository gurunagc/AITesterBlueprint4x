# SOP — Jira Issue Fetch

## Purpose
Fetch a Jira issue via REST API v3 and return raw JSON.

## Inputs
- `key`: Jira issue key (e.g. `MYC-1`)
- `.env`: `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`

## Logic
1. Load config from env via `JiraConfig.from_env()`.
2. Resolve API version: v3 for `atlassian.net`, v2 otherwise.
3. `GET {jira_url}/rest/api/{ver}/issue/{key}?fields=summary,description,issuetype,labels`
4. HTTP Basic Auth with email + token.
5. Handle status codes:
   - 401 → `JiraError("Jira authentication failed...")`
   - 404 → `JiraError("Jira ticket '{key}' not found.")`
   - != 200 → `JiraError(...)`
6. Return parsed JSON dict.

## Edge Cases
- Malformed URL in env → 400/401 from Jira.
- Network timeout → `requests.RequestException` caught, wrapped in `JiraError`.
- Non-JSON response → `ValueError` caught, wrapped in `JiraError`.

## Output
Raw JSON dict from Jira REST API. Passed to `parse_issue()`.
