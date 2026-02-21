"""Gemini integration and deterministic mock-mode fallback."""

from __future__ import annotations

import json
from collections import defaultdict
from typing import Any, TypeVar

from fastapi import Depends
from pydantic import BaseModel, ValidationError

from app.core.config import Settings, get_settings
from app.models.schemas import (
    AnalyzeClosetLLMResponse,
    ClosetItem,
    ClothingCategory,
    Formality,
    GenerateOutfitsLLMResponse,
    GenerateOutfitsRequest,
    OutfitPiece,
    OutfitSuggestion,
    Season,
)
from app.prompts.templates import build_analyze_closet_prompt, build_generate_outfits_prompt
from app.utils.file_validation import ImagePayload

try:
    from google import genai
    from google.genai import types
except Exception:  # pragma: no cover - dependency import fallback
    genai = None
    types = None


T = TypeVar("T", bound=BaseModel)


class GeminiServiceError(Exception):
    """Base error for Gemini service failures."""


class GeminiResponseFormatError(GeminiServiceError):
    """Raised when model output does not match expected JSON schema."""


class GeminiService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client = None

        if not settings.gemini_mock_mode:
            if not settings.gemini_api_key:
                raise GeminiServiceError(
                    "GEMINI_API_KEY is required when GEMINI_MOCK_MODE=false."
                )
            if genai is None:
                raise GeminiServiceError(
                    "google-genai SDK is not available. Install backend requirements first."
                )
            self._client = genai.Client(api_key=settings.gemini_api_key)

    def analyze_closet(
        self,
        *,
        manual_clothes_text: str | None,
        images: list[ImagePayload],
    ) -> AnalyzeClosetLLMResponse:
        if self.settings.gemini_mock_mode:
            return self._mock_analyze_closet(manual_clothes_text=manual_clothes_text, images=images)

        prompt = build_analyze_closet_prompt(manual_clothes_text)
        return self._generate_json_with_retry(
            prompt=prompt,
            images=images,
            schema_model=AnalyzeClosetLLMResponse,
        )

    def generate_outfits(self, request: GenerateOutfitsRequest) -> GenerateOutfitsLLMResponse:
        if self.settings.gemini_mock_mode:
            return self._mock_generate_outfits(request)

        prompt = build_generate_outfits_prompt(request)
        return self._generate_json_with_retry(
            prompt=prompt,
            images=[],
            schema_model=GenerateOutfitsLLMResponse,
        )

    def _generate_json_with_retry(
        self,
        *,
        prompt: str,
        images: list[ImagePayload],
        schema_model: type[T],
    ) -> T:
        last_error: Exception | None = None
        for _ in range(2):
            try:
                return self._generate_json_once(
                    prompt=prompt,
                    images=images,
                    schema_model=schema_model,
                )
            except (json.JSONDecodeError, ValidationError, GeminiServiceError) as exc:
                last_error = exc

        raise GeminiResponseFormatError(
            "Gemini returned invalid structured JSON after retry."
        ) from last_error

    def _generate_json_once(
        self,
        *,
        prompt: str,
        images: list[ImagePayload],
        schema_model: type[T],
    ) -> T:
        if self._client is None or types is None:
            raise GeminiServiceError("Gemini client is not initialized.")

        user_parts: list[Any] = [types.Part.from_text(text=prompt)]
        for image in images:
            user_parts.append(
                types.Part.from_bytes(
                    data=image.data,
                    mime_type=image.content_type,
                )
            )

        response = self._client.models.generate_content(
            model=self.settings.gemini_model,
            contents=[types.Content(role="user", parts=user_parts)],
            config=types.GenerateContentConfig(
                temperature=0,
                response_mime_type="application/json",
                response_schema=schema_model.model_json_schema(),
            ),
        )

        text = self._extract_response_text(response)
        payload = json.loads(text)
        return schema_model.model_validate(payload)

    @staticmethod
    def _extract_response_text(response: Any) -> str:
        text = (getattr(response, "text", None) or "").strip()
        if text:
            return text

        candidates = getattr(response, "candidates", None) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            if content is None:
                continue
            for part in getattr(content, "parts", []) or []:
                maybe_text = getattr(part, "text", "")
                if maybe_text:
                    return maybe_text.strip()

        raise GeminiServiceError("Gemini returned an empty response body.")

    def _mock_analyze_closet(
        self,
        *,
        manual_clothes_text: str | None,
        images: list[ImagePayload],
    ) -> AnalyzeClosetLLMResponse:
        names = self._parse_manual_names(manual_clothes_text)
        items: list[ClosetItem] = []

        for idx, name in enumerate(names, start=1):
            category = self._infer_category(name)
            items.append(
                ClosetItem(
                    id=f"manual-{idx}",
                    name=name,
                    category=category,
                    color=self._infer_color(name),
                    formality=Formality.smart_casual,
                    seasonality=[Season.spring, Season.fall],
                    tags=["manual-input", "mvp"],
                )
            )

        if images and len(items) < 4:
            items.extend(self._default_items(start=len(items) + 1))
        elif not items:
            items = self._default_items(start=1)

        warnings: list[str] = []
        if images and manual_clothes_text:
            warnings.append("Combined image and manual inputs. Verify color/details before wearing.")
        elif images:
            warnings.append("Image-only analysis may miss hidden details like material and fit.")

        summary = (
            f"Parsed {len(items)} clothing items and grouped them for outfit planning."
        )
        return AnalyzeClosetLLMResponse(summary=summary, items=items, warnings=warnings)

    def _mock_generate_outfits(self, request: GenerateOutfitsRequest) -> GenerateOutfitsLLMResponse:
        by_category: dict[ClothingCategory, list[ClosetItem]] = defaultdict(list)
        for item in request.closet_items:
            by_category[item.category].append(item)

        def pick(category: ClothingCategory, fallback: ClosetItem) -> ClosetItem:
            candidates = by_category.get(category) or []
            return candidates[0] if candidates else fallback

        fallback_item = request.closet_items[0]

        outfit_1 = OutfitSuggestion(
            outfit_id="outfit-1",
            title="Smart Daytime Core",
            pieces=[
                self._to_piece(pick(ClothingCategory.top, fallback_item), "Use as the visual anchor."),
                self._to_piece(
                    pick(ClothingCategory.bottom, fallback_item),
                    "Keeps the look balanced and easy to move in.",
                ),
                self._to_piece(pick(ClothingCategory.shoes, fallback_item), "Comfort-first for itinerary walking."),
            ],
            reasoning=(
                "Built for a polished but comfortable day plan. It fits mixed indoor/outdoor transitions "
                f"for '{request.occasion}'."
            ),
            confidence=0.86,
            alternatives=[
                "Swap shoes for a cleaner low-profile pair if your evening segment is dressier.",
                "Add a light outer layer if temperatures drop after sunset.",
            ],
        )

        outfit_2 = OutfitSuggestion(
            outfit_id="outfit-2",
            title="Layered Versatile Option",
            pieces=[
                self._to_piece(pick(ClothingCategory.top, fallback_item), "Base layer that works across activities."),
                self._to_piece(
                    pick(ClothingCategory.outerwear, fallback_item),
                    "Adds structure and weather flexibility.",
                ),
                self._to_piece(pick(ClothingCategory.bottom, fallback_item), "Neutral base to keep options open."),
                self._to_piece(pick(ClothingCategory.shoes, fallback_item), "Reliable for longer wear."),
            ],
            reasoning=(
                "This option adapts well to schedule changes in the itinerary while staying cohesive."
            ),
            confidence=0.82,
            alternatives=[
                "Replace outerwear with a cardigan for warmer conditions.",
                "Add one accessory for a stronger personal style signal.",
            ],
        )

        outfit_3 = OutfitSuggestion(
            outfit_id="outfit-3",
            title="Evening Lean-In",
            pieces=[
                self._to_piece(pick(ClothingCategory.top, fallback_item), "Cleaner silhouette for evening photos."),
                self._to_piece(pick(ClothingCategory.bottom, fallback_item), "Maintains contrast and shape."),
                self._to_piece(pick(ClothingCategory.accessory, fallback_item), "Adds intentional styling detail."),
                self._to_piece(pick(ClothingCategory.shoes, fallback_item), "Completes the formality level."),
            ],
            reasoning=(
                "A slightly elevated take suited for dinner or social stops while still using the same closet core."
            ),
            confidence=0.79,
            alternatives=[
                "If comfort is priority, remove accessory and keep the daytime shoes.",
                "Swap top for darker tone if the venue is more formal.",
            ],
        )

        return GenerateOutfitsLLMResponse(
            outfits=[outfit_1, outfit_2, outfit_3],
            global_tips=[
                "Steam or lint-roll pieces before leaving to raise overall polish.",
                "Pack one backup top if itinerary includes weather uncertainty.",
            ],
        )

    @staticmethod
    def _to_piece(item: ClosetItem, styling_note: str) -> OutfitPiece:
        return OutfitPiece(
            item_id=item.id,
            item_name=item.name,
            category=item.category,
            styling_note=styling_note,
        )

    @staticmethod
    def _infer_category(name: str) -> ClothingCategory:
        lowered = name.lower()
        if any(keyword in lowered for keyword in ["shirt", "tee", "top", "blouse"]):
            return ClothingCategory.top
        if any(keyword in lowered for keyword in ["pant", "jean", "skirt", "short"]):
            return ClothingCategory.bottom
        if "dress" in lowered:
            return ClothingCategory.dress
        if any(keyword in lowered for keyword in ["jacket", "coat", "hoodie", "blazer"]):
            return ClothingCategory.outerwear
        if any(keyword in lowered for keyword in ["shoe", "sneaker", "boot", "loafer"]):
            return ClothingCategory.shoes
        if any(keyword in lowered for keyword in ["watch", "belt", "bag", "hat", "ring"]):
            return ClothingCategory.accessory
        return ClothingCategory.other

    @staticmethod
    def _infer_color(name: str) -> str:
        lowered = name.lower()
        colors = [
            "black",
            "white",
            "blue",
            "navy",
            "gray",
            "green",
            "red",
            "brown",
            "beige",
        ]
        for color in colors:
            if color in lowered:
                return color
        return "unknown"

    def _default_items(self, *, start: int) -> list[ClosetItem]:
        return [
            ClosetItem(
                id=f"mock-{start}",
                name="White Oxford Shirt",
                category=ClothingCategory.top,
                color="white",
                material="cotton",
                formality=Formality.smart_casual,
                seasonality=[Season.spring, Season.fall],
                tags=["mock", "essential"],
            ),
            ClosetItem(
                id=f"mock-{start + 1}",
                name="Navy Chinos",
                category=ClothingCategory.bottom,
                color="navy",
                material="cotton",
                formality=Formality.smart_casual,
                seasonality=[Season.spring, Season.fall],
                tags=["mock", "essential"],
            ),
            ClosetItem(
                id=f"mock-{start + 2}",
                name="Brown Loafers",
                category=ClothingCategory.shoes,
                color="brown",
                material="leather",
                formality=Formality.formal,
                seasonality=[Season.spring, Season.summer, Season.fall],
                tags=["mock", "essential"],
            ),
            ClosetItem(
                id=f"mock-{start + 3}",
                name="Charcoal Blazer",
                category=ClothingCategory.outerwear,
                color="gray",
                material="wool-blend",
                formality=Formality.formal,
                seasonality=[Season.fall, Season.winter],
                tags=["mock", "layer"],
            ),
            ClosetItem(
                id=f"mock-{start + 4}",
                name="Silver Watch",
                category=ClothingCategory.accessory,
                color="silver",
                formality=Formality.smart_casual,
                seasonality=[Season.spring, Season.summer, Season.fall, Season.winter],
                tags=["mock", "accessory"],
            ),
        ]

    @staticmethod
    def _parse_manual_names(manual_clothes_text: str | None) -> list[str]:
        if not manual_clothes_text:
            return []

        normalized = manual_clothes_text.replace(";", "\n").replace(",", "\n")
        names = [line.strip(" -\t") for line in normalized.splitlines()]
        names = [name for name in names if name]
        return names[:20]


def get_gemini_service(settings: Settings = Depends(get_settings)) -> GeminiService:
    return GeminiService(settings)
