from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from . import crud, schemas
from .database import get_db, init_db
from .services.storage import ensure_storage_dir, iter_file_chunks, parse_range_header, resolve_file_path, save_upload

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATE_DIR = BASE_DIR / "templates"
STORAGE_DIR = Path(os.getenv("BEC_STORAGE_DIR", "storage/audio"))


@asynccontextmanager
async def lifespan(app: FastAPI):  # pragma: no cover - simple startup hook
    ensure_storage_dir(STORAGE_DIR)
    init_db()
    yield


app = FastAPI(title="Beneath the Ephemeral City Audio Engine", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATE_DIR)
templates.env.globals.update({"brand_name": "Beneath the Ephemeral City"})


@app.get("/", response_class=HTMLResponse)
def index(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/tracks", response_model=list[schemas.AudioTrackRead])
def read_tracks(db: Session = Depends(get_db)):
    return crud.list_audio_tracks(db)


@app.get("/api/tracks/{track_id}", response_model=schemas.AudioTrackRead)
def read_track(track_id: int, db: Session = Depends(get_db)):
    track = crud.get_audio_track(db, track_id)
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return track


@app.post("/api/upload", response_model=schemas.UploadResponse, status_code=201)
async def upload_track(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    if not file.content_type or not file.content_type.startswith("audio"):
        raise HTTPException(status_code=400, detail="Only audio uploads are supported")

    storage_name, filesize = save_upload(file, STORAGE_DIR)
    title = Path(file.filename).stem or "Untitled Track"

    track_data = schemas.AudioTrackCreate(
        title=title,
        original_filename=file.filename,
        storage_filename=storage_name,
        content_type=file.content_type,
        filesize=filesize,
    )
    track = crud.create_audio_track(db, track_data)
    return {"track": track}


@app.get("/stream/{track_id}")
def stream_track(track_id: int, request: Request, db: Session = Depends(get_db)):
    track = crud.get_audio_track(db, track_id)
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    try:
        file_path = resolve_file_path(STORAGE_DIR, track.storage_filename)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Track file missing") from exc

    file_size = file_path.stat().st_size
    range_header = request.headers.get("range")
    content_type = track.content_type or "audio/mpeg"

    if range_header:
        try:
            start, end = parse_range_header(range_header, file_size)
        except ValueError as exc:
            raise HTTPException(status_code=416, detail="Invalid range header") from exc

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(end - start + 1),
        }
        return StreamingResponse(
            iter_file_chunks(file_path, start=start, end=end),
            status_code=206,
            media_type=content_type,
            headers=headers,
        )

    headers = {"Accept-Ranges": "bytes", "Content-Length": str(file_size)}
    return StreamingResponse(iter_file_chunks(file_path), media_type=content_type, headers=headers)
