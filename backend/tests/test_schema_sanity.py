import pytest
from pydantic import ValidationError

from app.models.schemas import (
    ClosetItem,
    ClothingCategory,
    Formality,
    GenerateOutfitsResponse,
    OutfitPiece,
    OutfitSuggestion,
    Season,
)


def make_item() -> ClosetItem:
    return ClosetItem(
        id="item-1",
        name="White Tee",
        category=ClothingCategory.top,
        color="white",
        formality=Formality.casual,
        seasonality=[Season.spring, Season.summer],
        tags=["basic"],
    )


def make_outfit(outfit_id: str) -> OutfitSuggestion:
    item = make_item()
    return OutfitSuggestion(
        outfit_id=outfit_id,
        title="Casual Day",
        pieces=[
            OutfitPiece(
                item_id=item.id,
                item_name=item.name,
                category=item.category,
                styling_note="Use as base",
            ),
            OutfitPiece(
                item_id="item-2",
                item_name="Blue Jeans",
                category=ClothingCategory.bottom,
                styling_note="Add contrast",
            ),
        ],
        reasoning="Balanced casual look.",
        confidence=0.8,
        alternatives=["Swap jeans for chinos"],
    )


def test_generate_outfits_response_allows_two_to_four_items() -> None:
    payload = GenerateOutfitsResponse(
        occasion="Brunch",
        itinerary="Cafe then park",
        outfits=[make_outfit("outfit-1"), make_outfit("outfit-2")],
        global_tips=["Bring a light layer"],
    )

    assert len(payload.outfits) == 2


def test_generate_outfits_response_rejects_less_than_two_items() -> None:
    with pytest.raises(ValidationError):
        GenerateOutfitsResponse(
            occasion="Dinner",
            itinerary="Restaurant",
            outfits=[make_outfit("outfit-1")],
            global_tips=[],
        )
