from __future__ import annotations

import os
import sys
from importlib import import_module
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.filterwarnings(
    "ignore:The 'app' shortcut is now deprecated:DeprecationWarning"
)


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    storage_dir = tmp_path / "audio"
    monkeypatch.setenv("BEC_DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("BEC_STORAGE_DIR", str(storage_dir))

    project_root = Path(__file__).resolve().parents[1]
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    modules_to_remove = [name for name in list(sys.modules) if name.startswith("app.") or name == "app"]
    for name in modules_to_remove:
        sys.modules.pop(name)

    app_module = import_module("app.main")
    app = app_module.app

    with TestClient(app) as test_client:
        yield test_client, storage_dir


def test_upload_list_and_stream(client):
    test_client, storage_dir = client

    audio_payload = b"ID3" + os.urandom(512)
    response = test_client.post(
        "/api/upload",
        files={"file": ("luminous.mp3", audio_payload, "audio/mpeg")},
    )
    assert response.status_code == 201
    data = response.json()
    track = data["track"]

    assert track["title"] == "luminous"
    assert track["original_filename"] == "luminous.mp3"

    stored_files = list(storage_dir.iterdir())
    assert len(stored_files) == 1
    assert stored_files[0].read_bytes() == audio_payload

    list_response = test_client.get("/api/tracks")
    assert list_response.status_code == 200
    tracks = list_response.json()
    assert len(tracks) == 1
    assert tracks[0]["id"] == track["id"]

    stream_response = test_client.get(f"/stream/{track['id']}")
    assert stream_response.status_code == 200
    assert stream_response.content == audio_payload
    assert stream_response.headers.get("accept-ranges") == "bytes"

    range_response = test_client.get(
        f"/stream/{track['id']}",
        headers={"Range": "bytes=1-5"},
    )
    assert range_response.status_code == 206
    assert range_response.headers.get("content-range") == f"bytes 1-5/{len(audio_payload)}"
    assert range_response.content == audio_payload[1:6]


def test_rejects_non_audio_upload(client):
    test_client, _ = client
    response = test_client.post(
        "/api/upload",
        files={"file": ("notes.txt", b"Hello", "text/plain")},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Only audio uploads are supported"
