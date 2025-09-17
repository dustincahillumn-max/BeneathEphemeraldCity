from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from .database import Base


class AudioTrack(Base):
    __tablename__ = "audio_tracks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_filename = Column(String(255), nullable=False, unique=True)
    content_type = Column(String(127), nullable=True)
    filesize = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
