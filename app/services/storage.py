from __future__ import annotations

import shutil
from pathlib import Path
from typing import Iterable, Tuple
from uuid import uuid4

from fastapi import UploadFile

DEFAULT_CHUNK_SIZE = 1024 * 64


def ensure_storage_dir(storage_dir: Path) -> Path:
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


def save_upload(upload_file: UploadFile, storage_dir: Path) -> Tuple[str, int]:
    storage_dir = ensure_storage_dir(storage_dir)
    original_suffix = Path(upload_file.filename or "").suffix
    safe_suffix = original_suffix if original_suffix.isascii() else ""
    storage_name = f"{uuid4().hex}{safe_suffix}"
    file_path = storage_dir / storage_name
    upload_file.file.seek(0)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    filesize = file_path.stat().st_size
    return storage_name, filesize


def resolve_file_path(storage_dir: Path, storage_name: str) -> Path:
    file_path = storage_dir / storage_name
    if not file_path.exists():
        raise FileNotFoundError(storage_name)
    return file_path


def parse_range_header(range_header: str, file_size: int) -> Tuple[int, int]:
    units, _, range_spec = range_header.partition("=")
    if units.strip().lower() != "bytes":
        raise ValueError("Only 'bytes' range type is supported")

    start_str, _, end_str = range_spec.partition("-")
    if not start_str and not end_str:
        raise ValueError("Invalid Range header")

    if start_str:
        start = int(start_str)
    else:
        suffix_length = int(end_str)
        start = max(file_size - suffix_length, 0)
    end = int(end_str) if end_str else file_size - 1

    if start > end or end >= file_size:
        raise ValueError("Invalid range bounds")

    return start, end


def iter_file_chunks(
    file_path: Path, start: int = 0, end: int | None = None, chunk_size: int = DEFAULT_CHUNK_SIZE
) -> Iterable[bytes]:
    file_size = file_path.stat().st_size
    if end is None or end >= file_size:
        end = file_size - 1
    bytes_to_read = end - start + 1
    with open(file_path, "rb") as file_obj:
        file_obj.seek(start)
        while bytes_to_read > 0:
            read_size = min(chunk_size, bytes_to_read)
            data = file_obj.read(read_size)
            if not data:
                break
            bytes_to_read -= len(data)
            yield data
