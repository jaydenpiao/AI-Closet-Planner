"""Utilities for validating and reading uploaded image files."""

from dataclasses import dataclass
from typing import Sequence

from fastapi import UploadFile

from app.core.errors import bad_request, payload_too_large, unsupported_media_type


@dataclass
class ImagePayload:
    filename: str
    content_type: str
    data: bytes


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def validate_and_read_files(
    files: Sequence[UploadFile],
    *,
    max_files: int,
    max_upload_bytes: int,
) -> list[ImagePayload]:
    if len(files) > max_files:
        raise bad_request(f"Too many files. Maximum allowed is {max_files}.")

    payloads: list[ImagePayload] = []
    for file in files:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise unsupported_media_type(
                "Unsupported file type. Allowed types: image/jpeg, image/png, image/webp."
            )

        file_bytes = await file.read(max_upload_bytes + 1)
        if len(file_bytes) > max_upload_bytes:
            raise payload_too_large(
                f"File '{file.filename}' exceeds {max_upload_bytes // (1024 * 1024)}MB limit."
            )

        if len(file_bytes) == 0:
            raise bad_request(f"File '{file.filename}' is empty.")

        payloads.append(
            ImagePayload(
                filename=file.filename or "upload",
                content_type=file.content_type,
                data=file_bytes,
            )
        )
        await file.close()

    return payloads
