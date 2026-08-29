"""Local settings persistence (JSON), gitignored. No secrets in source."""
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SETTINGS_FILE = BASE_DIR / "settings.json"

DEFAULTS = {
    "provider": "ollama",
    "jira_url": "",
    "jira_email": "",
    "jira_api_token": "",
    "groq_api_key": "",
    "groq_model": "llama3-8b-8192",
    "ollama_url": "http://localhost:11434",
    "ollama_model": "gemma4:26b",
}


def load_settings() -> dict:
    data = {}
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError):
            data = {}
    return {**DEFAULTS, **data}


def save_settings(data: dict) -> None:
    merged = {**DEFAULTS, **data}
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = SETTINGS_FILE.with_name(SETTINGS_FILE.name + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2)
    tmp.replace(SETTINGS_FILE)
