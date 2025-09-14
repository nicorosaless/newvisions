import base64
import logging
from pathlib import Path
from typing import Optional

from backend.config import settings

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
        model_id = settings.elevenlabs_model
        voice_settings = VoiceSettings(stability=0.5, similarity_boost=0.75, style=0.3, use_speaker_boost=True)
        audio = client.text_to_speech.convert(
            voice_id=voice_id,
            optimize_streaming_latency=0,
            output_format="mp3_44100_128",
            text=text,
            model_id=model_id,
            voice_settings=voice_settings,
        )
        if isinstance(audio, (bytes, bytearray)):
            audio_bytes = bytes(audio)
        else:
            try:
                audio_bytes = b"".join(chunk for chunk in audio)  # type: ignore
            except Exception:
                audio_bytes = b""
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
                        model_id=model_id,
                        voice_settings=voice_settings,
                    )
                    if isinstance(audio, (bytes, bytearray)):
                        audio_bytes = bytes(audio)
                    else:
                        try:
                            audio_bytes = b"".join(chunk for chunk in audio)  # type: ignore
                        except Exception:
                            audio_bytes = b""
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


def mix_with_fan(cloned_mp3: bytes, fan_path: Path, fan_volume_pct: int) -> bytes:
    """Mix cloned voice mp3 with fan ambiance (or noise fallback) via ffmpeg.
    - fan_volume_pct: 0-100 scales fan loudness (0 = mute)
    - If fan file missing, generates soft brown noise using ffmpeg anullsrc + low-pass.
    Returns original audio if any step fails.
    """
    fan_volume_pct = max(0, min(100, fan_volume_pct))
    if fan_volume_pct == 0:
        logger.debug("mix_with_fan: volume=0 skip")
        return cloned_mp3
    import tempfile, subprocess, shutil
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        try:
            import imageio_ffmpeg
            ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            logger.debug("mix_with_fan: ffmpeg not available")
            return cloned_mp3
    use_noise_fallback = not fan_path.exists()
    if use_noise_fallback:
        logger.info("mix_with_fan: fan file missing (%s). Using noise fallback", fan_path)
    try:
        with tempfile.TemporaryDirectory() as td:
            td_path = Path(td)
            voice_in = td_path / "voice.mp3"
            ambiance_in = td_path / "fan.mp3"
            mixed_out = td_path / "mixed.mp3"
            voice_in.write_bytes(cloned_mp3)
            if not use_noise_fallback:
                ambiance_in.write_bytes(fan_path.read_bytes())
            scale = fan_volume_pct / 100.0
            if use_noise_fallback:
                # Generate soft broadband noise shaped & low-passed to ~300Hz for subtle hum
                # anullsrc creates silent stream; then afftdn for noise? Instead create pink-ish using anoisesrc if available.
                # Some ffmpeg builds lack anoisesrc; fallback to sine at very low freq + small band noise approach.
                filter_complex = (
                    f"[0:a]aresample=async=1:first_pts=0[voice];"
                    f"anoisesrc=colour=brown:amplitude=0.4:duration=3600,lowpass=f=300,volume={scale:.3f}[fan];"
                    f"[voice][fan]amix=inputs=2:duration=first:dropout_transition=0[a]"
                )
                cmd = [
                    ffmpeg_bin, "-hide_banner", "-loglevel", "error",
                    "-i", str(voice_in),
                    "-filter_complex", filter_complex,
                    "-map", "[a]",
                    "-c:a", "mp3", "-q:a", "4",
                    str(mixed_out)
                ]
            else:
                cmd = [
                    ffmpeg_bin, "-hide_banner", "-loglevel", "error",
                    "-i", str(voice_in),
                    "-i", str(ambiance_in),
                    "-filter_complex",
                    f"[1:a]volume={scale:.3f}[fan];[0:a][fan]amix=inputs=2:duration=first:dropout_transition=0[a]",
                    "-map", "[a]",
                    "-c:a", "mp3", "-q:a", "4",
                    str(mixed_out)
                ]
            subprocess.run(cmd, check=True, timeout=30)
            if mixed_out.exists() and mixed_out.stat().st_size > 1000:
                out_bytes = mixed_out.read_bytes()
                logger.info("mix_with_fan: mixed success bytes=%d noise_fallback=%s scale=%.2f", len(out_bytes), use_noise_fallback, scale)
                return out_bytes
            logger.warning("mix_with_fan: mixed file missing/too small")
    except subprocess.CalledProcessError as e:
        logger.warning("mix_with_fan: ffmpeg failed rc=%s", e.returncode)
    except Exception as e:
        logger.warning("mix_with_fan outer error: %s", e)
    return cloned_mp3

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
