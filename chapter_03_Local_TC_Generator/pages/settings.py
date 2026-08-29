import os
import sys
import streamlit as st

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from config_store import load_settings, save_settings

st.set_page_config(page_title="Settings", page_icon="⚙️", layout="centered")
st.title("⚙️ Settings")
st.caption("Jira credentials, LLM provider, and Groq API key. Stored locally — never in source.")

settings = load_settings()
provider_index = 0 if settings.get("provider", "ollama") == "ollama" else 1

with st.form("settings_form", clear_on_submit=False):
    st.subheader("Jira")
    jira_url = st.text_input("Jira base URL", value=settings.get("jira_url", ""))
    jira_email = st.text_input("Jira email ID", value=settings.get("jira_email", ""))
    jira_api_token = st.text_input("Jira API token", value=settings.get("jira_api_token", ""), type="password")

    st.subheader("LLM provider")
    provider = st.selectbox(
        "Default LLM backend",
        options=["ollama", "groq"],
        index=provider_index,
        format_func=str.title,
    )
    st.caption(
        "Ollama uses the local model `gemma4:26b` at `http://localhost:11434`. "
        "Groq is used as automatic fallback when Ollama is unavailable, or when selected."
    )

    st.subheader("Groq (fallback)")
    groq_api_key = st.text_input("Groq API key", value=settings.get("groq_api_key", ""), type="password")
    groq_model = st.text_input("Groq model", value=settings.get("groq_model", "openai/gpt-oss-20b"))

    submitted = st.form_submit_button("Save configuration")
    if submitted:
        save_settings({
            "provider": provider,
            "jira_url": jira_url,
            "jira_email": jira_email,
            "jira_api_token": jira_api_token,
            "groq_api_key": groq_api_key,
            "groq_model": groq_model,
        })
        st.success("Configuration saved.")
