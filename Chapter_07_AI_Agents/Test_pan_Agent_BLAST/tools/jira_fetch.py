"""Fetch a Jira issue via the REST API v3.

Handshake script for BLAST Protocol Phase 2 (Link).
Verifies that Jira credentials are valid and the API responds.
"""
from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from typing import Any

import requests
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth


class JiraError(Exception):
    """Raised when a Jira API call fails."""


@dataclass
class JiraConfig:
    """Jira connection configuration loaded from environment variables."""

    jira_url: str
    jira_email: str
    jira_api_token: str

    @classmethod
    def from_env(cls) -> "JiraConfig":
        """Load configuration from `.env` or environment variables."""
        load_dotenv()
        jira_url = os.getenv("JIRA_URL", "")
        jira_email = os.getenv("JIRA_EMAIL", "")
        jira_api_token = os.getenv("JIRA_API_TOKEN", "")

        if not jira_url:
            raise JiraError("JIRA_URL is not set in environment.")
        if not jira_email or not jira_api_token:
            raise JiraError("JIRA_EMAIL / JIRA_API_TOKEN not set in environment.")

        return cls(
            jira_url=jira_url.rstrip("/"),
            jira_email=jira_email,
            jira_api_token=jira_api_token,
        )


def _resolve_api_version(jira_url: str) -> str:
    """Use API v3 for Jira Cloud, v2 for self-hosted."""
    return "3" if "atlassian.net" in jira_url else "2"


def fetch_issue(
    key: str,
    config: JiraConfig,
    fields: str = "summary,description,issuetype,labels",
) -> dict[str, Any]:
    """Fetch a single Jira issue by key.

    Args:
        key: Jira issue key (e.g. ``MYC-1``).
        config: Parsed :class:`JiraConfig`.
        fields: Comma-separated list of fields to request.

    Returns:
        Raw JSON response from the Jira REST API.

    Raises:
        JiraError: On auth failure, not-found, or non-200 response.
    """
    api_version = _resolve_api_version(config.jira_url)
    url = f"{config.jira_url}/rest/api/{api_version}/issue/{key}?fields={fields}"

    try:
        resp = requests.get(
            url,
            auth=HTTPBasicAuth(config.jira_email, config.jira_api_token),
            timeout=30,
            headers={"Accept": "application/json"},
        )
    except requests.RequestException as exc:
        raise JiraError(f"Unable to reach Jira: {exc}") from exc

    if resp.status_code == 401:
        raise JiraError("Jira authentication failed. Check email/API token.")
    if resp.status_code == 404:
        raise JiraError(f"Jira ticket '{key}' not found.")
    if resp.status_code != 200:
        raise JiraError(f"Jira returned error {resp.status_code}: {resp.text[:200]}")

    try:
        return resp.json()
    except ValueError as exc:
        raise JiraError("Jira returned a non-JSON response.") from exc


def main(key: str) -> None:
    """CLI entry point — fetch and print a Jira issue summary."""
    config = JiraConfig.from_env()
    data = fetch_issue(key, config)

    issue_fields = data.get("fields", {})
    print(f"Key:      {data.get('key', key)}")
    print(f"Summary:  {issue_fields.get('summary', '')}")
    issue_type = issue_fields.get("issuetype", {})
    if isinstance(issue_type, dict):
        print(f"Type:     {issue_type.get('name', '')}")
    desc = issue_fields.get("description", "")
    if isinstance(desc, dict):
        content = desc.get("content", [])
        print(f"ADF nodes: {len(content) if isinstance(content, list) else 'unknown'}")
    elif desc:
        print(f"Description (text): {desc[:80]}...")

    print("Jira handshake: OK")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m tools.jira_fetch <ISSUE_KEY>")
        sys.exit(1)
    main(sys.argv[1])
