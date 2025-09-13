from pydantic import BaseModel, Field
from typing import Optional


class ThoughtRequest(BaseModel):
    topic: str = Field(..., description="High-level topic, e.g. 'Movies'")
    value: str = Field(..., description="Specific value within the topic")


class ThoughtResponse(BaseModel):
    thought: str


class AudioRequest(BaseModel):
    topic: str
    value: str


class AudioResponse(BaseModel):
    # Base64 mp3 or a URL; for now, we'll return base64 content
    audio_base64: str
    text: str
    filename: str | None = None


class UserSettings(BaseModel):
    voice_language: str = Field(default="en")
    speaker_sex: str = Field(default="male")
    voice_stability: int = Field(ge=0, le=100, default=50)
    voice_similarity: int = Field(ge=0, le=100, default=75)
    background_sound: bool = Field(default=False)
    background_volume: int = Field(ge=0, le=100, default=30)
    voice_note_name: Optional[str] = Field(default=None, max_length=50)
    voice_note_date: Optional[str] = Field(default=None, description="ISO date string YYYY-MM-DD")


class SettingsUpdateRequest(UserSettings):
    pass


class PerformRequest(BaseModel):
    user_id: str
    routine_type: str
    value: str
    # Optional snapshot override (front-end may omit to use stored settings)
    settings_override: Optional[UserSettings] = None


class PerformResponse(BaseModel):
    routine_type: str
    text: str
    audio_base64: str
    filename: Optional[str]
    charCount: int
    monthlyLimit: int
    voiceSource: Optional[str] = Field(default=None, description="Source of voice audio: user|placeholder|tts")
