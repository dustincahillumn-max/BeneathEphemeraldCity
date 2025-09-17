from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AudioTrackBase(BaseModel):
    title: str
    original_filename: str
    content_type: Optional[str]
    filesize: int


class AudioTrackCreate(AudioTrackBase):
    storage_filename: str


class AudioTrackRead(AudioTrackBase):
    id: int
    uploaded_at: datetime

    class Config:
        orm_mode = True


class UploadResponse(BaseModel):
    track: AudioTrackRead
