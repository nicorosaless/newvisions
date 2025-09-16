#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timedelta
import json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, ROOT)

from backend.config import settings


def main():
    if not settings.elevenlabs_api_key:
        print("Missing ELEVENLABS_API_KEY; aborting.")
        return 1
    from elevenlabs.client import ElevenLabs  # type: ignore
    import requests

    client = ElevenLabs(api_key=settings.elevenlabs_api_key)
    print("Fetching current voices...")
    resp = client.voices.get_all()
    voices = getattr(resp, "voices", resp) or []

    # Filter account-owned voices that consume slots: category != premade
    ours = []
    for v in voices:
        name = getattr(v, "name", None) or (v.get("name") if isinstance(v, dict) else None)
        voice_id = getattr(v, "voice_id", None) or (v.get("voice_id") if isinstance(v, dict) else None)
        category = getattr(v, "category", None) or (v.get("category") if isinstance(v, dict) else None)
        if not name or not voice_id:
            continue
        if isinstance(category, str) and category.lower() == "premade":
            continue
        ours.append((name, voice_id))

    # Delete ours to free slots
    headers = {"xi-api-key": settings.elevenlabs_api_key}
    print(f"Deleting {len(ours)} provider voices to clean slots...")
    for name, vid in ours:
        try:
            url = f"https://api.elevenlabs.io/v1/voices/{vid}"
            r = requests.delete(url, headers=headers, timeout=20)
            print(f"delete {name} ({vid}) -> {r.status_code}")
        except Exception as e:
            print(f"delete {name} ({vid}) error: {e}")

    # Seed 10 voices using cloningvoice.mp3 with staggered timestamps
    sample_path = os.path.join(ROOT, "cloningvoice.mp3")
    if not os.path.isfile(sample_path):
        print(f"Sample not found: {sample_path}")
        return 1

    print("Seeding 10 test voices...")
    now = datetime.utcnow()
    seeded = []
    for i in range(10):
        name = f"sim_user_{i+1:02d}"
        ts = (now - timedelta(minutes=i*5)).isoformat() + "Z"
        labels = {"created_at": ts, "last_used_at": ts, "source": "newvisions", "user_id": f"seed_{i+1:02d}"}
        files = [("files", (f"{name}.mp3", open(sample_path, "rb"), "audio/mpeg"))]
        data = {"name": name, "description": f"created_at:{ts}", "labels": json.dumps(labels)}
        try:
            r = requests.post("https://api.elevenlabs.io/v1/voices/add", headers=headers, files=files, data=data, timeout=90)
            r.raise_for_status()
            vid = r.json().get("voice_id")
            seeded.append((name, vid, ts))
            print(f"created {name} ({vid}) at {ts}")
        except Exception as e:
            print(f"create {name} error: {e}")

    # Print subscription and MRU via preperform
    try:
        from backend.preperform import list_elevenlabs_voices_mru, get_subscription_info
        sub = get_subscription_info()
        mru = list_elevenlabs_voices_mru()
        print("\nSubscription:")
        print(json.dumps(sub, indent=2))
        print("\nMRU voices (name, voice_id, last_used_at):")
        for v in mru:
            print(f"- {v['name']} {v['voice_id']} {v.get('last_used_at')}")
    except Exception as e:
        print(f"Failed to list MRU: {e}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
