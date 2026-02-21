"""Closet analysis route."""

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.config import Settings, get_settings
from app.core.errors import bad_gateway, bad_request
from app.models.schemas import AnalyzeClosetResponse, ClothingCategory
from app.services.gemini_service import (
    GeminiResponseFormatError,
    GeminiService,
    GeminiServiceError,
    get_gemini_service,
)
from app.utils.file_validation import validate_and_read_files

router = APIRouter(tags=["closet"])


@router.post("/analyze-closet", response_model=AnalyzeClosetResponse)
async def analyze_closet(
    files: list[UploadFile] | None = File(default=None, alias="files[]"),
    manual_clothes_text: str | None = Form(default=None),
    settings: Settings = Depends(get_settings),
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> AnalyzeClosetResponse:
    manual_text = manual_clothes_text.strip() if manual_clothes_text else None
    has_manual_text = bool(manual_text)
    has_files = bool(files)

    if not has_manual_text and not has_files:
        raise bad_request("Provide at least one input: files[] or manual_clothes_text.")

    image_payloads = []
    if files:
        image_payloads = await validate_and_read_files(
            files,
            max_files=settings.max_upload_files,
            max_upload_bytes=settings.max_upload_bytes,
        )

    try:
        parsed = gemini_service.analyze_closet(
            manual_clothes_text=manual_text,
            images=image_payloads,
        )
    except GeminiResponseFormatError as exc:
        raise bad_gateway(
            "Gemini returned invalid JSON after retry. Please retry your request."
        ) from exc
    except GeminiServiceError as exc:
        raise bad_gateway(str(exc)) from exc

    category_counts = {category: 0 for category in ClothingCategory}
    for item in parsed.items:
        category_counts[item.category] += 1

    source = "images+manual_text" if has_files and has_manual_text else "images" if has_files else "manual_text"

    return AnalyzeClosetResponse(
        source=source,
        summary=parsed.summary,
        items=parsed.items,
        category_counts=category_counts,
        warnings=parsed.warnings,
    )
