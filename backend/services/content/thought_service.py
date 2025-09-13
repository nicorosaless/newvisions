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


def build_routine_prompt(routine_type: str, value: str, language: str = "en") -> str:
    """Return a specialized prompt per routine_type. language currently unused beyond placeholder.
    Routine types (examples): text-input, cards, numbers, star-signs.
    """
    base_intro = (
        "You are a concise, natural-sounding inner monologue writer. Respond with ONE short thought (1–2 sentences). "
        "Avoid lists, disclaimers, and questions unless essential."
    )
    if routine_type == "text-input":
        return f"{base_intro}\nContext: {value}\nThought:"
    if routine_type == "cards":
        return f"{base_intro} The user drew these conceptual 'cards': {value}. Combine them into a single reflective insight.\nThought:"
    if routine_type == "numbers":
        return f"{base_intro} The user provided these numbers: {value}. Derive a metaphorical reflection linking them subtly.\nThought:"
    if routine_type == "star-signs":
        return f"{base_intro} The user provided astrological or symbolic signs: {value}. Produce a grounded, gentle inner thought (no mystical claims).\nThought:"
    # Fallback generic
    return _format_prompt(routine_type, value)


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


def generate_from_prompt(prompt: str, fallback_topic: str = "prompt") -> str:
    """Generate text directly from a full prompt, mirroring logic of generate_thought.
    If API key missing or failure, returns a lightweight fallback referencing fallback_topic.
    """
    if not settings.google_api_key:
        return f"A quick reflection about {fallback_topic}."
    try:
        import google.generativeai as genai  # type: ignore
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
        return text.strip() if text else f"Reflection about {fallback_topic}."
    except Exception:
        return f"Reflection about {fallback_topic}."
