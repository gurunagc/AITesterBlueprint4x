import re
from pathlib import Path

import jinja2
import streamlit as st

from config_store import load_settings
from jira_client import JiraError, get_ticket
from llm_client import LLMError, generate as llm_generate

BASE_DIR = Path(__file__).resolve().parent
TEMPLATE_DIR = BASE_DIR / "templates"
TEMPLATE_NAME = "test_case_template.jinja2"

KEY_RE = re.compile(r"\b([A-Z][A-Z0-9_]*-\d+)\b")


def render_prompt(ticket: dict) -> str:
    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(str(TEMPLATE_DIR)),
        keep_trailing_newline=True,
    )
    tmpl = env.get_template(TEMPLATE_NAME)
    return tmpl.render(**ticket)


def main() -> None:
    st.set_page_config(page_title="Jira Test Case Generator", page_icon="🧪", layout="wide")

    with st.sidebar:
        st.header("Jira TC Generator")
        st.caption("Local Ollama model with automatic Groq fallback.")
        settings = load_settings()
        st.caption(f"Provider: **{settings.get('provider', 'ollama').title()}**")
        st.page_link("app.py", label="Chat", icon="💬")
        st.page_link("pages/settings.py", label="Settings", icon="⚙️")

    st.title("Jira Test Case Generator")
    st.caption("Type a request like `create test cases for QA-102` and press Enter.")

    if "messages" not in st.session_state:
        st.session_state.messages = []

    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    prompt = st.chat_input("Message...")
    if not prompt:
        return

    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    key_match = KEY_RE.search(prompt)
    if not key_match:
        response = (
            "I couldn't find a Jira ticket key. Include one like: "
            "`create test cases for QA-102`."
        )
        st.session_state.messages.append({"role": "assistant", "content": response})
        with st.chat_message("assistant"):
            st.markdown(response)
        return

    key = key_match.group(1)
    settings = load_settings()
    with st.chat_message("assistant"):
        with st.spinner(f"Fetching {key} and generating test cases..."):
            try:
                ticket = get_ticket(key, settings)
                rendered = render_prompt(ticket)
                result = llm_generate(rendered, settings)
                st.markdown(result)
                st.session_state.messages.append({"role": "assistant", "content": result})
            except (JiraError, LLMError) as e:
                st.error(str(e))
                st.session_state.messages.append({"role": "assistant", "content": f"❌ {e}"})


if __name__ == "__main__":
    main()
