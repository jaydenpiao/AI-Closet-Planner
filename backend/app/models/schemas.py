"""Pydantic schemas for API request and response contracts."""

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ClothingCategory(str, Enum):
    top = "top"
    bottom = "bottom"
    dress = "dress"
    outerwear = "outerwear"
    shoes = "shoes"
    accessory = "accessory"
    other = "other"


class Formality(str, Enum):
    casual = "casual"
    smart_casual = "smart-casual"
    formal = "formal"
    athleisure = "athleisure"
    unknown = "unknown"


class Season(str, Enum):
    spring = "spring"
    summer = "summer"
    fall = "fall"
    winter = "winter"


class ClosetItem(BaseModel):
    id: str
    name: str
    category: ClothingCategory
    color: str
    material: str | None = None
    pattern: str | None = None
    formality: Formality
    seasonality: list[Season]
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None


class AnalyzeClosetResponse(BaseModel):
    source: Literal["images", "manual_text", "images+manual_text"]
    summary: str
    items: list[ClosetItem]
    category_counts: dict[ClothingCategory, int]
    warnings: list[str] = Field(default_factory=list)


class GenerateOutfitsRequest(BaseModel):
    closet_items: list[ClosetItem] = Field(min_length=1)
    occasion: str = Field(min_length=1)
    itinerary: str = Field(min_length=1)
    preferences: str | None = None


class OutfitPiece(BaseModel):
    item_id: str
    item_name: str
    category: ClothingCategory
    styling_note: str


class OutfitSuggestion(BaseModel):
    outfit_id: str
    title: str
    pieces: list[OutfitPiece] = Field(min_length=2)
    reasoning: str
    confidence: float = Field(ge=0, le=1)
    alternatives: list[str] = Field(default_factory=list)


class GenerateOutfitsResponse(BaseModel):
    occasion: str
    itinerary: str
    outfits: list[OutfitSuggestion]
    global_tips: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_outfit_count(self) -> "GenerateOutfitsResponse":
        if not (2 <= len(self.outfits) <= 4):
            raise ValueError("Outfits must contain between 2 and 4 suggestions")
        return self


class AnalyzeClosetLLMResponse(BaseModel):
    summary: str
    items: list[ClosetItem]
    warnings: list[str] = Field(default_factory=list)


class GenerateOutfitsLLMResponse(BaseModel):
    outfits: list[OutfitSuggestion]
    global_tips: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_outfit_count(self) -> "GenerateOutfitsLLMResponse":
        if not (2 <= len(self.outfits) <= 4):
            raise ValueError("Outfits must contain between 2 and 4 suggestions")
        return self


class AuthenticatedUser(BaseModel):
    user_id: str
    email: str | None = None
    display_name: str | None = None
    access_token: str | None = None


class MeResponse(BaseModel):
    user_id: str
    email: str | None = None
    display_name: str | None = None


class ClosetItemCreate(BaseModel):
    name: str = Field(min_length=1)
    category: ClothingCategory
    color: str = Field(min_length=1)
    material: str | None = None
    pattern: str | None = None
    formality: Formality
    seasonality: list[Season] = Field(min_length=1)
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None


class ClosetItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    category: ClothingCategory | None = None
    color: str | None = Field(default=None, min_length=1)
    material: str | None = None
    pattern: str | None = None
    formality: Formality | None = None
    seasonality: list[Season] | None = None
    tags: list[str] | None = None
    notes: str | None = None


class ClosetItemRecord(BaseModel):
    id: str
    user_id: str
    name: str
    category: ClothingCategory
    color: str
    material: str | None = None
    pattern: str | None = None
    formality: Formality
    seasonality: list[Season]
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None
    image_path: str | None = None
    image_mime_type: str | None = None
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime


class SavedOutfitCreate(BaseModel):
    title: str | None = None
    occasion: str = Field(min_length=1)
    itinerary: str = Field(min_length=1)
    outfit_snapshot: OutfitSuggestion
    global_tips: list[str] = Field(default_factory=list)


class SavedOutfitRecord(BaseModel):
    id: str
    user_id: str
    title: str | None = None
    occasion: str
    itinerary: str
    outfit_snapshot: OutfitSuggestion
    global_tips: list[str] = Field(default_factory=list)
    created_at: datetime


class ProtectedGenerateOutfitsRequest(BaseModel):
    occasion: str = Field(min_length=1)
    itinerary: str = Field(min_length=1)
    preferences: str | None = None


class DeleteResponse(BaseModel):
    deleted: bool
