"""Jira REST API client for fetching ticket details."""
import re
import requests
from requests.auth import HTTPBasicAuth


class JiraError(Exception):
    pass


def _extract_text(node):
    """Recursively pull text out of Atlassian Document Format (ADF) nodes,
    or return plain strings untouched."""
    if node is None:
        return ""
    if isinstance(node, str):
        return node
    if isinstance(node, dict):
        if node.get("type") == "text":
            return node.get("text", "")
        content = node.get("content")
        if isinstance(content, list):
            return "".join(_extract_text(c) for c in content)
        if isinstance(content, str):
            return content
        return ""
    if isinstance(node, list):
        return "".join(_extract_text(c) for c in node)
    return str(node)


def parse_description(raw):
    return _extract_text(raw) if raw is not None else ""


_ACCEPTANCE_RE = re.compile(
    r"(?:\n|^)\s*(?:h2\.|\##|\*\*|\>\s*)\s*Acceptance\s*Criteria\s*[:\-]?",
    re.IGNORECASE | re.MULTILINE,
)
_NEXT_HEADING_RE = re.compile(r"\n(?:h2\.|\##|\*\*[A-Z])", re.MULTILINE)


def extract_acceptance_criteria(text: str) -> str:
    m = _ACCEPTANCE_RE.search(text)
    if not m:
        return ""
    rest = text[m.end():]
    nxt = _NEXT_HEADING_RE.search(rest)
    if nxt:
        rest = rest[: nxt.start()]
    return rest.strip()


def get_ticket(key: str, settings: dict, fields: str = "summary,description") -> dict:
    jira_url = (settings.get("jira_url") or "").rstrip("/")
    email = settings.get("jira_email", "")
    token = settings.get("jira_api_token", "")
    if not jira_url:
        raise JiraError("Jira URL is not configured. Set it in Settings.")
    if not email or not token:
        raise JiraError("Jira email/API token not configured. Set them in Settings.")

    api_version = "2" if "atlassian.net" not in jira_url else "3"
    url = f"{jira_url}/rest/api/{api_version}/issue/{key}?fields={fields}"

    try:
        resp = requests.get(url, auth=HTTPBasicAuth(email, token), timeout=30)
    except requests.RequestException as e:
        raise JiraError(f"Unable to reach Jira: {e}")

    if resp.status_code == 401:
        raise JiraError("Jira authentication failed. Check email/API token in Settings.")
    if resp.status_code == 404:
        raise JiraError(f"Jira ticket '{key}' not found.")
    if resp.status_code != 200:
        raise JiraError(f"Jira returned error {resp.status_code}: {resp.text[:200]}")

    try:
        data = resp.json()
    except ValueError:
        raise JiraError("Jira returned a non-JSON response.")

    f = data.get("fields", {})
    description_text = parse_description(f.get("description", ""))
    return {
        "key": data.get("key", key),
        "summary": f.get("summary", ""),
        "description": description_text,
        "acceptance_criteria": extract_acceptance_criteria(description_text),
    }
