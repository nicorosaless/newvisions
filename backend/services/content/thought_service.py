from typing import Optional

from ..config import settings


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

        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        resp = model.generate_content(prompt)
        text: Optional[str] = getattr(resp, "text", None)
        if not text:
            # Sometimes content parts may exist
            try:
                text = "".join([p.text for p in resp.candidates[0].content.parts])  # type: ignore[attr-defined]
            except Exception:
                text = None
        return text.strip() if text else f"Here's a quick thought about {topic}: {value}."
    except Exception:
        # Silent fallback to keep API robust
        return f"Here's a quick thought about {topic}: {value}."
