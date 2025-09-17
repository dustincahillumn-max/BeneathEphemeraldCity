from __future__ import annotations

from typing import Iterable, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models, schemas


def create_audio_track(db: Session, track_data: schemas.AudioTrackCreate) -> models.AudioTrack:
    track = models.AudioTrack(
        title=track_data.title,
        original_filename=track_data.original_filename,
        storage_filename=track_data.storage_filename,
        content_type=track_data.content_type,
        filesize=track_data.filesize,
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return track


def list_audio_tracks(db: Session) -> Iterable[models.AudioTrack]:
    stmt = select(models.AudioTrack).order_by(models.AudioTrack.uploaded_at.desc())
    return db.execute(stmt).scalars().all()


def get_audio_track(db: Session, track_id: int) -> Optional[models.AudioTrack]:
    stmt = select(models.AudioTrack).where(models.AudioTrack.id == track_id)
    return db.execute(stmt).scalar_one_or_none()
