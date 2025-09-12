from pydantic import BaseModel, Field


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
