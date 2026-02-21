"""Outfit generation route."""

from fastapi import APIRouter, Depends

from app.core.errors import bad_gateway
from app.models.schemas import GenerateOutfitsRequest, GenerateOutfitsResponse
from app.services.gemini_service import (
    GeminiResponseFormatError,
    GeminiService,
    GeminiServiceError,
    get_gemini_service,
)

router = APIRouter(tags=["outfits"])


@router.post("/generate-outfits", response_model=GenerateOutfitsResponse)
async def generate_outfits(
    payload: GenerateOutfitsRequest,
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> GenerateOutfitsResponse:
    try:
        generated = gemini_service.generate_outfits(payload)
    except GeminiResponseFormatError as exc:
        raise bad_gateway(
            "Gemini returned invalid JSON after retry. Please retry your request."
        ) from exc
    except GeminiServiceError as exc:
        raise bad_gateway(str(exc)) from exc

    return GenerateOutfitsResponse(
        occasion=payload.occasion,
        itinerary=payload.itinerary,
        outfits=generated.outfits,
        global_tips=generated.global_tips,
    )
