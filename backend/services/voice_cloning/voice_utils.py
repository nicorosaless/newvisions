"""
Voice data utilities for handling recorded voice binary data from MongoDB.

This module provides functions to:
- Retrieve voice data from MongoDB
- Decode base64-encoded audio data
- Save audio to temporary files
- Play audio using system commands
"""

import base64
import os
import subprocess
import sys
import tempfile
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Add the project root to Python path so we can import backend modules
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.config import settings
from pymongo import MongoClient

logger = logging.getLogger(__name__)


class VoiceDataError(Exception):
    """Custom exception for voice data related errors."""
    pass


def get_mongodb_connection() -> Tuple[Any, MongoClient]:
    """Get MongoDB database connection."""
    if not settings.mongo_uri:
        raise VoiceDataError("MONGO_URI not configured")

    try:
        client = MongoClient(settings.mongo_uri, tlsAllowInvalidCertificates=True)
        client.admin.command('ping')
        db = client["voicememos_db"]
        logger.info("Successfully connected to MongoDB")
        return db, client
    except Exception as e:
        raise VoiceDataError(f"Failed to connect to MongoDB: {e}")


def find_user_voice_data(username: Optional[str] = None) -> Optional[Tuple[Dict[str, Any], str]]:
    """
    Find user with voice data.

    Args:
        username: Specific username to search for, or None to find any user with voice data

    Returns:
        Tuple of (user_document, voice_field_name) or None if not found
    """
    db, client = get_mongodb_connection()
    try:
        users_collection = db["users"]

        # Possible field names for voice data
        possible_fields = ["recordedVoiceBinary", "recordedVoice", "voiceData", "audioData"]

        if username:
            # Find specific user
            user = users_collection.find_one({"username": username})
            if not user:
                return None

            # Check which voice field exists
            for field_name in possible_fields:
                if user.get(field_name):
                    return user, field_name
            return None
        else:
            # Find any user with voice data
            for field_name in possible_fields:
                query = {field_name: {"$exists": True, "$ne": None}}
                user = users_collection.find_one(query)
                if user:
                    return user, field_name

        return None
    finally:
        client.close()


def decode_voice_data(base64_data: str) -> bytes:
    """
    Decode base64-encoded voice data to raw audio bytes.

    Args:
        base64_data: Base64-encoded audio data (may include data URL prefix)

    Returns:
        Raw audio bytes

    Raises:
        VoiceDataError: If decoding fails
    """
    try:
        # Remove data URL prefix if present (e.g., "data:audio/mp3;base64,")
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]

        audio_bytes = base64.b64decode(base64_data)
        logger.info(f"Successfully decoded voice data: {len(audio_bytes)} bytes")
        return audio_bytes
    except Exception as e:
        raise VoiceDataError(f"Failed to decode base64 voice data: {e}")


def save_voice_to_temp_file(audio_bytes: bytes, filename: str = "voice_sample.mp3") -> Path:
    """
    Save audio bytes to a temporary file.

    Args:
        audio_bytes: Raw audio data
        filename: Name for the temporary file

    Returns:
        Path to the temporary file

    Raises:
        VoiceDataError: If saving fails
    """
    try:
        temp_dir = Path(tempfile.gettempdir())
        temp_file = temp_dir / filename
        temp_file.write_bytes(audio_bytes)
        logger.info(f"Voice data saved to: {temp_file}")
        return temp_file
    except Exception as e:
        raise VoiceDataError(f"Failed to save voice data to temporary file: {e}")


def play_voice_audio(file_path: Path) -> bool:
    """
    Play audio file using system default player.

    Args:
        file_path: Path to the audio file

    Returns:
        True if playback was successful, False otherwise
    """
    try:
        if not file_path.exists():
            logger.error(f"Audio file does not exist: {file_path}")
            return False

        if sys.platform == "darwin":  # macOS
            subprocess.run(["afplay", str(file_path)], check=True, capture_output=True)
        elif sys.platform == "linux":
            subprocess.run(["aplay", str(file_path)], check=True, capture_output=True)
        elif sys.platform == "win32":  # Windows
            os.startfile(str(file_path))
        else:
            logger.warning(f"Unsupported platform for audio playback: {sys.platform}")
            return False

        logger.info("Audio playback completed successfully")
        return True

    except subprocess.CalledProcessError as e:
        logger.error(f"Audio playback failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during audio playback: {e}")
        return False


def get_voice_data_info(user: Dict[str, Any], voice_field: str) -> Dict[str, Any]:
    """
    Get information about voice data for a user.

    Args:
        user: User document from MongoDB
        voice_field: Name of the field containing voice data

    Returns:
        Dictionary with voice data information
    """
    voice_data = user.get(voice_field)

    info = {
        "username": user.get("username", "Unknown"),
        "user_id": str(user.get("_id", "Unknown")),
        "voice_field": voice_field,
        "has_voice_data": voice_data is not None,
    }

    if voice_data:
        if isinstance(voice_data, str):
            info.update({
                "data_type": "base64_string",
                "data_length": len(voice_data),
                "estimated_audio_size": len(base64.b64decode(voice_data.split(",")[-1]) if "," in voice_data else base64.b64decode(voice_data))
            })
        else:
            info.update({
                "data_type": str(type(voice_data)),
                "data_size": len(voice_data) if hasattr(voice_data, '__len__') else "Unknown"
            })

    return info


def test_voice_playback(username: Optional[str] = None) -> Dict[str, Any]:
    """
    Test function to retrieve and play voice data.

    Args:
        username: Specific username to test, or None to find any user with voice data

    Returns:
        Dictionary with test results
    """
    result = {
        "success": False,
        "message": "",
        "user_info": None,
        "audio_file": None,
        "playback_success": False
    }

    try:
        # Find user with voice data
        user_data = find_user_voice_data(username)
        if not user_data:
            result["message"] = f"No voice data found{' for user ' + username if username else ''}"
            return result

        user, voice_field = user_data
        result["user_info"] = get_voice_data_info(user, voice_field)

        # Get and decode voice data
        voice_data = user.get(voice_field)
        audio_bytes = decode_voice_data(voice_data)

        # Save to temporary file
        temp_file = save_voice_to_temp_file(audio_bytes)
        result["audio_file"] = str(temp_file)

        # Play the audio
        playback_success = play_voice_audio(temp_file)
        result["playback_success"] = playback_success

        # Clean up
        try:
            temp_file.unlink()
            logger.info(f"Cleaned up temporary file: {temp_file}")
        except Exception as e:
            logger.warning(f"Could not clean up temporary file: {e}")

        result["success"] = True
        result["message"] = "Voice data retrieved and played successfully"

    except VoiceDataError as e:
        result["message"] = str(e)
    except Exception as e:
        result["message"] = f"Unexpected error: {e}"
        logger.error(f"Voice playback test failed: {e}")

    return result
