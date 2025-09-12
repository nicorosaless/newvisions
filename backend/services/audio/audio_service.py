import base64
import logging
from pathlib import Path
from typing import Optional

from ..config import settings

logger = logging.getLogger(__name__)


def _load_sample_bytes(path: Path) -> Optional[bytes]:
    try:
        return path.read_bytes()
    except Exception:
        return None


def synthesize_audio_bytes(text: str) -> bytes:
    """Return raw MP3 bytes for given text (may be silent placeholder)."""
    if not text.strip():
        raise ValueError("Text must not be empty")
    api_key = settings.elevenlabs_api_key
    if not api_key:
        # decode placeholder
        # Small valid silent mp3 (base64) ~1s
        placeholder = (
            "SUQzAwAAAAAAF1RTU0UAAAAPAAADTGF2ZjU2LjMyLjEwNAAAAAAAAAAAAAAA//tQxAADBQAAQAAAANAAAAC"
            "wCAAAACAAADSAAAAAEAAAC0H///8AAAAATGF2YyBzaWxlbmNlIGZpbGU="
        )
        return base64.b64decode(placeholder)
    try:
        from elevenlabs.client import ElevenLabs  # type: ignore
        from elevenlabs import VoiceSettings  # type: ignore
        client = ElevenLabs(api_key=api_key)
        voice_id = settings.elevenlabs_voice_id or "21m00Tcm4TlvDq8ikWAM"  # fallback to known valid voice
        voice_settings = VoiceSettings(stability=0.5, similarity_boost=0.75, style=0.3, use_speaker_boost=True)
        audio = client.text_to_speech.convert(
            voice_id=voice_id,
            optimize_streaming_latency=0,
            output_format="mp3_44100_128",
            text=text,
            voice_settings=voice_settings,
        )
        if hasattr(audio, "__iter__") and not isinstance(audio, (bytes, bytearray)):
            audio_bytes = b"".join(chunk for chunk in audio)
        else:
            audio_bytes = bytes(audio)
        logger.info("ElevenLabs audio bytes=%d", len(audio_bytes))
        return audio_bytes
    except Exception as e:
        logger.warning("ElevenLabs synthesis failed for voice %s: %s", voice_id, e)
        # Try fallback to first available voice
        try:
            voices = client.voices.get_all().voices  # type: ignore
            if voices:
                fallback_voice_id = getattr(voices[0], 'voice_id', None)
                if fallback_voice_id:
                    logger.info("Trying fallback voice: %s", fallback_voice_id)
                    audio = client.text_to_speech.convert(
                        voice_id=fallback_voice_id,
                        optimize_streaming_latency=0,
                        output_format="mp3_44100_128",
                        text=text,
                        voice_settings=voice_settings,
                    )
                    if hasattr(audio, "__iter__") and not isinstance(audio, (bytes, bytearray)):
                        audio_bytes = b"".join(chunk for chunk in audio)
                    else:
                        audio_bytes = bytes(audio)
                    logger.info("Fallback audio bytes=%d", len(audio_bytes))
                    return audio_bytes
        except Exception as fallback_e:
            logger.error("Fallback synthesis also failed: %s", fallback_e)
        # Final fallback to silent placeholder
        fallback = (
            "SUQzAwAAAAAAF1RTU0UAAAAPAAADTGF2ZjU2LjMyLjEwNAAAAAAAAAAAAAAA//tQxAADBQAAQAAAANAAAAC"
            "wCAAAACAAADSAAAAAEAAAC0H///8AAAAATGF2YyBzaWxlbmNlIGZpbGU="
        )
        return base64.b64decode(fallback)


def synthesize_audio(text: str) -> str:
    """Backward compatible: return base64 string."""
    return base64.b64encode(synthesize_audio_bytes(text)).decode("utf-8")

def synthesize_and_save(text: str, tmp_dir: Path) -> tuple[str, Path]:
    """Generate audio, save it to tmp_dir, return (base64, path)."""
    tmp_dir.mkdir(parents=True, exist_ok=True)
    raw = synthesize_audio_bytes(text)
    import time, hashlib
    digest = hashlib.sha1(raw[:128]).hexdigest()  # short content-based name
    filename = f"audio_{int(time.time())}_{digest[:8]}.mp3"
    path = tmp_dir / filename
    path.write_bytes(raw)
    return base64.b64encode(raw).decode("utf-8"), path


def elevenlabs_status() -> dict:
    api_key = settings.elevenlabs_api_key
    if not api_key:
        return {"configured": False, "reason": "missing_api_key"}
    try:
        from elevenlabs.client import ElevenLabs  # type: ignore
        client = ElevenLabs(api_key=api_key)
        voices = client.voices.get_all().voices  # type: ignore
        voice_ids = [getattr(v, 'voice_id', None) for v in voices][:5]
        test_bytes = synthesize_audio_bytes("Connection test.")
        return {
            "configured": True,
            "voices_sample": voice_ids,
            "test_audio_size": len(test_bytes),
            "using_custom_voice": bool(settings.elevenlabs_voice_id),
        }
    except Exception as e:
        return {"configured": True, "error": str(e)}
