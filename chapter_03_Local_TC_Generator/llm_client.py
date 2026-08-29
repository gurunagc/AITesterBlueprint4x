"""LLM backend: local Ollama with Groq fallback."""
import requests


class LLMError(Exception):
    pass


def check_ollama_available(settings: dict, timeout: float = 3.0) -> bool:
    url = (settings.get("ollama_url") or "http://localhost:11434") + "/api/tags"
    try:
        r = requests.get(url, timeout=timeout)
        return r.status_code == 200
    except requests.RequestException:
        return False


def ollama_generate(prompt: str, settings: dict, timeout: float = 120.0) -> str:
    url = (settings.get("ollama_url") or "http://localhost:11434") + "/api/chat"
    payload = {
        "model": settings.get("ollama_model", "gemma4:26b"),
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
    }
    try:
        r = requests.post(url, json=payload, timeout=timeout)
    except requests.RequestException as e:
        raise LLMError(f"Ollama request failed: {e}")
    if r.status_code != 200:
        raise LLMError(f"Ollama error {r.status_code}: {r.text[:200]}")
    try:
        data = r.json()
    except ValueError:
        raise LLMError("Ollama returned a non-JSON response.")
    return (data.get("message") or {}).get("content", "")


def groq_generate(prompt: str, settings: dict, timeout: float = 60.0) -> str:
    api_key = settings.get("groq_api_key", "")
    if not api_key:
        raise LLMError("Groq API key is required. Add it in Settings.")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {
        "model": settings.get("groq_model", "openai/gpt-oss-20b"),
        "messages": [{"role": "user", "content": prompt}],
    }
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        raise LLMError(f"Groq request failed: {e}")
    if r.status_code != 200:
        raise LLMError(f"Groq error {r.status_code}: {r.text[:200]}")
    data = r.json()
    if not data.get("choices"):
        raise LLMError("Groq returned no choices.")
    return data["choices"][0]["message"]["content"]


def generate(prompt: str, settings: dict) -> str:
    """Generate text. Ollama by default with automatic Groq fallback when
    Ollama is unavailable; Groq used directly when provider == 'groq'."""
    provider = settings.get("provider", "ollama")
    if provider == "groq":
        return groq_generate(prompt, settings)

    if check_ollama_available(settings):
        try:
            return ollama_generate(prompt, settings)
        except LLMError:
            if settings.get("groq_api_key"):
                return groq_generate(prompt, settings)
            raise

    if settings.get("groq_api_key"):
        return groq_generate(prompt, settings)
    raise LLMError(
        "Ollama is not running and no Groq API key is configured. "
        "Start Ollama or add a Groq key in Settings."
    )
