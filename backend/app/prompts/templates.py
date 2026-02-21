"""Prompt templates for deterministic Gemini interactions."""

import json

from app.models.schemas import ClosetItem, GenerateOutfitsRequest


ANALYZE_CLOSET_PROMPT = """You are a wardrobe parser.
Return ONLY a JSON object that matches the response schema exactly.
Do not output markdown, code fences, commentary, or extra keys.
Hard constraints:
- summary: concise plain text (1-2 sentences)
- items: deduplicate obvious repeats across image and manual inputs
- category: one of [top, bottom, dress, outerwear, shoes, accessory, other]
- formality: one of [casual, smart-casual, formal, athleisure, unknown]
- seasonality: list values only from [spring, summer, fall, winter]
- warnings: list of concise strings (empty list if none)
"""


GENERATE_OUTFITS_PROMPT = """You are an outfit planner.
Return ONLY a JSON object that matches the response schema exactly.
Do not output markdown, code fences, commentary, or extra keys.
Hard constraints:
- outfits length must be between 2 and 4
- each outfit must include at least 2 pieces
- confidence must be a number between 0 and 1
- category: one of [top, bottom, dress, outerwear, shoes, accessory, other]
- piece item_id values must reference provided closet item ids
- avoid duplicate identical item_id values within the same outfit when alternatives exist
- reasoning/alternatives/global_tips should be concise and practical
"""


def build_analyze_closet_prompt(manual_clothes_text: str | None) -> str:
    manual_section = manual_clothes_text.strip() if manual_clothes_text else ""
    return (
        f"{ANALYZE_CLOSET_PROMPT}\n\n"
        "Context:\n"
        f"manual_clothes_text:\n{manual_section if manual_section else '<none>'}\n"
        "If images are included, combine image + text evidence and deduplicate obvious repeats."
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
        "Constraints: produce practical, wearable combinations for the full itinerary."
    )
