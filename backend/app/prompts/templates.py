"""Prompt templates for deterministic Gemini interactions."""

import json

from app.models.schemas import ClosetItem, GenerateOutfitsRequest


ANALYZE_CLOSET_PROMPT = """You are a wardrobe parser.
Return JSON only matching the schema exactly.
No markdown. No extra keys.
Infer sensible categories/formality/seasonality from the provided inputs.
"""


GENERATE_OUTFITS_PROMPT = """You are an outfit planner.
Return JSON only matching the schema exactly.
No markdown. No extra keys.
Generate practical outfit combinations based on closet items, occasion, and itinerary.
"""


def build_analyze_closet_prompt(manual_clothes_text: str | None) -> str:
    manual_section = manual_clothes_text.strip() if manual_clothes_text else ""
    return (
        f"{ANALYZE_CLOSET_PROMPT}\n\n"
        "Context:\n"
        f"manual_clothes_text:\n{manual_section if manual_section else '<none>'}\n"
        "If images are included, combine both sources and deduplicate obvious repeats."
    )


def build_generate_outfits_prompt(request: GenerateOutfitsRequest) -> str:
    closet_data = [item.model_dump(mode="json") for item in request.closet_items]
    return (
        f"{GENERATE_OUTFITS_PROMPT}\n\n"
        "Context:\n"
        f"occasion: {request.occasion}\n"
        f"itinerary: {request.itinerary}\n"
        f"preferences: {request.preferences or '<none>'}\n"
        f"closet_items_json: {json.dumps(closet_data, ensure_ascii=True)}\n"
        "Constraints: return 2 to 4 outfits, confidence between 0 and 1, and concise reasoning."
    )
