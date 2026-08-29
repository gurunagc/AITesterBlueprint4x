# Jira Test Case Generator (Local)

A two-screen Streamlit app that turns a single Jira ticket into a draft set of
**functional** test cases using a local Ollama LLM, with an **automatic Groq
fallback** when Ollama is unavailable.

## Features
- **Screen 1 — Chat:** ChatGPT-style input. Type `create test cases for QA-102` and get
  a structured test-case table rendered in the chat pane.
- **Screen 2 — Settings:** Persist Jira URL, email, API token, choose the LLM provider
  (Ollama / Groq), and store a Groq API key — saved locally to a gitignored
  `settings.json`.
- **Default backend:** Ollama, model `gemma4:26b`, at `http://localhost:11434`.
- **Fallback:** If Ollama is down/unreachable (or you select Groq), the app calls Groq
  automatically. Groq is only ever called when Ollama is unavailable or selected.

## Prerequisites
- Python 3.9+ (tested with 3.14)
- **Ollama** installed and running, with the model `gemma4:26b` present locally:
  ```bash
  ollama run gemma4:26b   # pull/ensure model present
  ollama serve             # serve on http://localhost:11434
  ```
  Without Ollama you can still run everything via Groq (see Settings).
- A **Jira** Cloud/Server account + API token
  (generate at https://id.atlassian.com/manage-profile/security/api-tokens).
- (Optional) A **Groq** API key at https://console.groq.com/ — used automatically
  when Ollama is unavailable.

## Setup (local)
1. Open a terminal in the project and go to the folder:
   ```bash
   cd AITesterBlueprint4x/chapter_03_Local_TC_Generator
   ```
2. (Recommended) create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate      # Windows
   # source .venv/bin/activate  # macOS / Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configure
1. Start the app (see **Run**).
2. In the sidebar, click **Settings** and enter:
   - Jira base URL (e.g. `https://your-domain.atlassian.net`)
   - Jira email ID
   - Jira API token
   - LLM provider (`Ollama` by default)
   - Groq API key (only needed for fallback)
3. Click **Save configuration**. Values are stored in the local, gitignored
   `settings.json`.

## Run
```bash
python -m streamlit run app.py
```
Then open the printed URL (usually http://localhost:8501).

> Tip: if `streamlit` is not on your PATH, use `python -m streamlit run app.py`.

## Usage
1. With the app running and Settings configured, type a natural-language request
   containing a Jira ticket key:
   ```
   create test cases for QA-102
   ```
2. The app:
   1. parses the ticket key (`QA-102`),
   2. fetches summary / description / acceptance criteria from Jira,
   3. merges them into `templates/test_case_template.jinja2`,
   4. sends the prompt to Ollama (or Groq on fallback),
   5. renders the structured test-case table in the chat.

## Project structure
```
.
├── app.py                            # Screen 1 — chat
├── pages/settings.py                 # Screen 2 — settings
├── config_store.py                   # read/write settings.json
├── jira_client.py                    # Jira REST API fetcher
├── llm_client.py                     # Ollama + Groq with fallback
├── templates/
│   └── test_case_template.jinja2     # prompt template
├── requirements.txt
└── .gitignore                        # settings.json, __pycache__/
```

## Troubleshooting
- **`streamlit` is not recognized** → run `python -m streamlit run app.py`.
- **"Jira URL is not configured" / auth errors** → open Settings and save credentials.
- **Ollama errors or slow generation** → run `ollama serve`, or switch provider to
  `Groq` in Settings and add a Groq key.
- **`gemma4:26b` not present** → run `ollama run gemma4:26b` once before launching.
- **No/garbled test cases** → confirm the Jira ticket has a Description with
  acceptance criteria, and that `templates/test_case_template.jinja2` exists.

## Notes
- No credentials are hardcoded in source. All secrets live in the local, gitignored
  `settings.json`.
- Ollama is the default and preferred backend; Groq is a fallback only.
## for now as we dont know the unknows we have to use prompt to run this app in local 
make this app run in local using any Assistant tool 
default it is in llama3-8b-8192 but change to openai/gpt-oss-20b or any free mdoel in grow 