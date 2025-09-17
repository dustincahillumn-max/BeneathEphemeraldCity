# Beneath the Ephemeral City · Audio Engine

A FastAPI-powered web experience for the Beneath the Ephemeral City universe. The application lets curators upload
audio files, preview them inside a cinematic interface, and stream the media with HTTP range support for smooth
playback.

## Features

- **Immersive interface** inspired by the setting of Beneath the Ephemeral City with hero, upload, and archive views.
- **Audio uploads** via drag-and-drop or traditional file selection with live progress feedback.
- **Streaming playback** using authenticated URLs that support HTTP range requests, enabling seeking inside the audio
  element.
- **SQLite persistence** for uploaded track metadata (title, file size, MIME type, upload timestamp).
- **Clipboard-friendly sharing** so visitors can copy a direct streaming URL for each track.

## Getting Started

### 1. Create a virtual environment (optional but recommended)

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the development server

```bash
uvicorn app.main:app --reload
```

The site will be available at <http://127.0.0.1:8000>. Uploaded audio files are stored in `storage/audio`. You can
change the storage location or database path via environment variables before launching the app:

- `BEC_STORAGE_DIR` — folder used to store uploaded audio (default `storage/audio`).
- `BEC_DATABASE_URL` — SQLAlchemy connection string for the metadata database (default `sqlite:///./app.db`).

## Testing

The project uses `pytest` to cover the upload and streaming flow. Run the suite with:

```bash
pytest
```

## Project Structure

```
app/
├── crud.py             # Database operations for audio tracks
├── database.py         # SQLAlchemy engine and session management
├── main.py             # FastAPI application with routes and streaming logic
├── models.py           # SQLAlchemy models
├── schemas.py          # Pydantic schemas for API responses
├── services/
│   └── storage.py      # Helpers for saving files and handling byte ranges
├── static/
│   ├── css/style.css   # Styling for the web experience
│   └── js/app.js       # Client-side interactivity (uploads, filters, audio controls)
└── templates/index.html# Cinematic interface for the archive
```

Additional assets live in the `storage/audio` directory (kept empty in Git via `.gitkeep`).
