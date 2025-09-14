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


def build_voice_note_prompt(routine_type: str, topic: str, value: str, user_language: str) -> str:
    """Build the safe/system style prompt for the Gemini generation covering all routine types.

    routine_type is kept for future specialization (e.g., slight tone tweaks) but template remains shared.
    topic: conceptual topic (we must NOT mention it explicitly per spec, only guide mood)
    value: value string that MUST appear naturally
    user_language: target language of the output
    """
    routine_type = (routine_type or "").strip().lower()
    user_language = user_language or "en"
    # Potential future minor adaptation per routine_type; for now identical baseline.
    # We only ensure the instructions are explicit and consistent.
    safe_prompt = f"""
──────────  ROLE  ──────────
You are a fully awake person who just got ready for the day — and you're recording a quick, casual voice note in {user_language}.
You suddenly remembered a weird dream, or had a strange passing thought, and you want to say it out loud before you forget.

────────  MUST‑HAVES  ────────
1. Language: The entire note must be in {user_language}.
2. Tone: Awake, calm, and casual — like you're talking to yourself or a friend in the morning.
3. Value inclusion: The value ({value}) must be mentioned naturally (verbatim) once; do not force repetition.
4. Topic as subtext: Do NOT mention the topic ({topic}) explicitly — it only guides mood/situation.
5. Length: One or two short sentences — the output must be between 80 and 120 characters long.
6. Emotion: Curious, chill, or mildly puzzled — no drama or exaggeration.

────────  STYLE TIPS  ────────
• Use conversational, natural speech for {user_language} — like casual morning self-talk.
• Optional light filler words typical for the language (e.g., "no sé", "o algo", "creo", "kinda", etc.).
• Avoid sounding polished; contractions or slight trailing thoughts are fine.
• Loose punctuation acceptable (commas, ellipses) but no lists.

────────  EXAMPLES (adapt mentally to {user_language})  ────────
EN: "I was getting my stuff together and suddenly remembered this odd bit... someone was freaked out by spiders. No idea why that popped up."
ES: "Estaba ya vistiéndome y me vino esta imagen rarísima... alguien hablaba de arañas y se ponía super nervioso, no sé por qué volvió."
FR: "J'étais prêt à sortir et d'un coup un petit truc revient... quelqu'un flippait à cause des araignées. Bizarre que ça revienne."
DE: "Ich war fast aus der Tür und plötzlich kam dieses seltsame Bild hoch... jemand hatte echt Angst vor Spinnen. Keine Ahnung wieso wieder."
IT: "Stavo per uscire e all'improvviso mi torna questa scena... qualcuno parlava dei ragni ed era agitato. Non so perché."

────────  OUTPUT RULE  ────────
Return only the voice note in {user_language}. No labels, no quotation marks, no extra commentary.
""".strip()
    return safe_prompt


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
