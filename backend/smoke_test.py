import base64
import json
from pathlib import Path

import requests


BASE = "http://localhost:5002"


def test_generate_thought():
    r = requests.post(
        f"{BASE}/generate-thought",
        json={"topic": "Movies", "value": "Sci-fi"},
        timeout=20,
    )
    r.raise_for_status()
    data = r.json()
    print("Thought:", data)


def test_generate_audio():
    r = requests.post(
        f"{BASE}/generate-audio",
        json={"topic": "Movies", "value": "Sci-fi"},
        timeout=60,
    )
    r.raise_for_status()
    data = r.json()
    print("Audio response text:", data.get("text"))
    audio_b64 = data.get("audio_base64", "")
    if audio_b64:
        out = Path(__file__).parent / "sample.mp3"
        out.write_bytes(base64.b64decode(audio_b64))
        print(f"Wrote {out}")


if __name__ == "__main__":
    test_generate_thought()
    test_generate_audio()
