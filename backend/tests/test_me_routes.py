from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import (
    ClosetItemRecord,
    ClothingCategory,
    Formality,
    GenerateOutfitsLLMResponse,
    OutfitPiece,
    OutfitSuggestion,
    SavedOutfitRecord,
    Season,
)
from app.services.gemini_service import get_gemini_service
from app.services.supabase_service import SupabaseAuthError, get_supabase_service


client = TestClient(app)


class FakeSupabaseService:
    def __init__(self) -> None:
        self.items: dict[str, ClosetItemRecord] = {}
        self.saved: dict[str, SavedOutfitRecord] = {}

    def validate_access_token(self, access_token: str):  # noqa: ANN001
        if access_token != "good-token":
            raise SupabaseAuthError("Invalid or expired Supabase session token.")
        from app.models.schemas import AuthenticatedUser

        return AuthenticatedUser(
            user_id="user-1",
            email="owner@example.com",
            display_name="Owner",
            access_token=access_token,
        )

    def upsert_profile(
        self,
        *,
        user_id: str,
        display_name: str | None,
        access_token: str | None = None,
    ) -> None:
        return None

    def list_closet_items(
        self,
        *,
        user_id: str,
        access_token: str | None = None,
    ) -> list[ClosetItemRecord]:
        return [item for item in self.items.values() if item.user_id == user_id]

    def create_closet_item(
        self,
        *,
        user_id: str,
        payload,  # noqa: ANN001
        access_token: str | None = None,
    ):
        now = datetime.now(timezone.utc)
        record = ClosetItemRecord(
            id="item-1",
            user_id=user_id,
            name=payload.name,
            category=payload.category,
            color=payload.color,
            material=payload.material,
            pattern=payload.pattern,
            formality=payload.formality,
            seasonality=payload.seasonality,
            tags=payload.tags,
            notes=payload.notes,
            image_path=None,
            image_mime_type=None,
            image_url=None,
            created_at=now,
            updated_at=now,
        )
        self.items[record.id] = record
        return record

    def update_closet_item(
        self,
        *,
        user_id: str,
        item_id: str,
        payload,  # noqa: ANN001
        access_token: str | None = None,
    ):
        current = self.items[item_id]
        update_data = payload.model_dump(exclude_none=True)
        updated = current.model_copy(update=update_data | {"updated_at": datetime.now(timezone.utc)})
        self.items[item_id] = updated
        return updated

    def delete_closet_item(
        self,
        *,
        user_id: str,
        item_id: str,
        access_token: str | None = None,
    ) -> None:
        self.items.pop(item_id, None)

    def set_closet_item_image(
        self,
        *,
        user_id: str,
        item_id: str,
        content_type: str,
        content: bytes,
        access_token: str | None = None,
    ) -> ClosetItemRecord:
        current = self.items[item_id]
        updated = current.model_copy(
            update={
                "image_path": f"{user_id}/{item_id}/primary.jpg",
                "image_mime_type": content_type,
                "image_url": "https://example.com/signed.jpg",
                "updated_at": datetime.now(timezone.utc),
            }
        )
        self.items[item_id] = updated
        return updated

    def clear_closet_item_image(
        self,
        *,
        user_id: str,
        item_id: str,
        access_token: str | None = None,
    ) -> ClosetItemRecord:
        current = self.items[item_id]
        updated = current.model_copy(
            update={
                "image_path": None,
                "image_mime_type": None,
                "image_url": None,
                "updated_at": datetime.now(timezone.utc),
            }
        )
        self.items[item_id] = updated
        return updated

    def list_saved_outfits(
        self,
        *,
        user_id: str,
        access_token: str | None = None,
    ) -> list[SavedOutfitRecord]:
        return [item for item in self.saved.values() if item.user_id == user_id]

    def create_saved_outfit(
        self,
        *,
        user_id: str,
        payload,  # noqa: ANN001
        access_token: str | None = None,
    ):
        record = SavedOutfitRecord(
            id="saved-1",
            user_id=user_id,
            title=payload.title,
            occasion=payload.occasion,
            itinerary=payload.itinerary,
            outfit_snapshot=payload.outfit_snapshot,
            global_tips=payload.global_tips,
            created_at=datetime.now(timezone.utc),
        )
        self.saved[record.id] = record
        return record

    def delete_saved_outfit(
        self,
        *,
        user_id: str,
        saved_outfit_id: str,
        access_token: str | None = None,
    ) -> None:
        self.saved.pop(saved_outfit_id, None)

    @staticmethod
    def to_generation_closet_items(items: list[ClosetItemRecord]):  # noqa: ANN001
        from app.services.supabase_service import SupabaseService

        return SupabaseService.to_generation_closet_items(items)


class FakeGeminiService:
    def generate_outfits(self, request):  # noqa: ANN001
        outfit_1 = OutfitSuggestion(
            outfit_id="outfit-1",
            title="Primary",
            pieces=[
                OutfitPiece(
                    item_id=request.closet_items[0].id,
                    item_name=request.closet_items[0].name,
                    category=request.closet_items[0].category,
                    styling_note="Core piece",
                ),
                OutfitPiece(
                    item_id="item-2",
                    item_name="Extra",
                    category=ClothingCategory.bottom,
                    styling_note="Balance",
                ),
            ],
            reasoning="Works well",
            confidence=0.9,
            alternatives=["Swap shoes"],
        )
        outfit_2 = outfit_1.model_copy(update={"outfit_id": "outfit-2", "title": "Alternate"})
        return GenerateOutfitsLLMResponse(
            outfits=[outfit_1, outfit_2],
            global_tips=["Tip"],
        )


def auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer good-token"}


def setup_overrides() -> FakeSupabaseService:
    fake_supabase = FakeSupabaseService()
    app.dependency_overrides[get_supabase_service] = lambda: fake_supabase
    app.dependency_overrides[get_gemini_service] = lambda: FakeGeminiService()
    return fake_supabase


def teardown_overrides() -> None:
    app.dependency_overrides.clear()


def test_protected_routes_require_token() -> None:
    setup_overrides()
    try:
        response = client.get("/api/me")
    finally:
        teardown_overrides()

    assert response.status_code == 401
    assert "Authorization header is required" in response.json()["detail"]


def test_me_endpoint_returns_user() -> None:
    setup_overrides()
    try:
        response = client.get("/api/me", headers=auth_headers())
    finally:
        teardown_overrides()

    assert response.status_code == 200
    assert response.json()["user_id"] == "user-1"


def test_closet_item_create_update_delete_flow() -> None:
    fake_supabase = setup_overrides()
    payload = {
        "name": "White Tee",
        "category": "top",
        "color": "white",
        "material": None,
        "pattern": None,
        "formality": "casual",
        "seasonality": ["spring", "summer"],
        "tags": ["basic"],
        "notes": None,
    }
    try:
        created = client.post("/api/me/closet-items", headers=auth_headers(), json=payload)
        assert created.status_code == 200

        listed = client.get("/api/me/closet-items", headers=auth_headers())
        assert listed.status_code == 200
        assert len(listed.json()) == 1

        updated = client.patch(
            "/api/me/closet-items/item-1",
            headers=auth_headers(),
            json={"color": "black"},
        )
        assert updated.status_code == 200
        assert updated.json()["color"] == "black"

        deleted = client.delete("/api/me/closet-items/item-1", headers=auth_headers())
        assert deleted.status_code == 200
        assert deleted.json()["deleted"] is True
    finally:
        teardown_overrides()

    assert fake_supabase.items == {}


def test_generate_outfits_from_saved_closet() -> None:
    fake_supabase = setup_overrides()
    now = datetime.now(timezone.utc)
    fake_supabase.items["item-1"] = ClosetItemRecord(
        id="item-1",
        user_id="user-1",
        name="White Tee",
        category=ClothingCategory.top,
        color="white",
        material=None,
        pattern=None,
        formality=Formality.casual,
        seasonality=[Season.spring, Season.summer],
        tags=[],
        notes=None,
        image_path=None,
        image_mime_type=None,
        image_url=None,
        created_at=now,
        updated_at=now,
    )

    try:
        response = client.post(
            "/api/me/generate-outfits",
            headers=auth_headers(),
            json={
                "occasion": "Dinner",
                "itinerary": "7pm date at bar",
                "preferences": "neutral colors",
            },
        )
    finally:
        teardown_overrides()

    assert response.status_code == 200
    data = response.json()
    assert data["occasion"] == "Dinner"
    assert 2 <= len(data["outfits"]) <= 4
