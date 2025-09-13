from typing import Optional

from backend.config import settings


def _format_prompt(topic: str, value: str) -> str:
    return (
        "You are a concise, natural-sounding inner monologue writer. "
        "Given a topic and a value, write a single, friendly thought (1–2 sentences), "
        "avoiding lists and disclaimers.\n\n"
        f"Topic: {topic}\n"
        f"Value: {value}\n\n"
        "Thought:"
    )


def generate_thought(topic: str, value: str) -> str:
    """Generate a short natural-sounding thought. Uses Google Generative AI if available; otherwise returns a heuristic fallback."""
    prompt = _format_prompt(topic, value)

    # Fallback if no API key
    if not settings.google_api_key:
        return f"Thinking about {topic} and {value}—there's something interesting there."

    try:
        import google.generativeai as genai  # type: ignore

        # Some versions expose configure via genai.configure; keep guarded
        if hasattr(genai, "configure"):
            genai.configure(api_key=settings.google_api_key)  # type: ignore[attr-defined]
        model = getattr(genai, "GenerativeModel", None)
        if model is None:
            raise RuntimeError("GenerativeModel not available in google.generativeai")
        mdl = model("gemini-1.5-flash")
        resp = mdl.generate_content(prompt)
        text: Optional[str] = getattr(resp, "text", None)
        if not text:
            try:
                candidates = getattr(resp, "candidates", [])
                if candidates:
                    parts = getattr(candidates[0].content, "parts", [])  # type: ignore
                    text = "".join([getattr(p, "text", "") for p in parts])
            except Exception:
                text = None
        return text.strip() if text else f"Here's a quick thought about {topic}: {value}."
    except Exception:
        return f"Here's a quick thought about {topic}: {value}."
