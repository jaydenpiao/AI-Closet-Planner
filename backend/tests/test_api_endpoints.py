from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import AnalyzeClosetResponse, GenerateOutfitsResponse
from app.services.gemini_service import GeminiServiceError, get_gemini_service


client = TestClient(app)


def build_generate_payload() -> dict:
    return {
        "closet_items": [
            {
                "id": "manual-1",
                "name": "white tee",
                "category": "top",
                "color": "white",
                "material": None,
                "pattern": None,
                "formality": "casual",
                "seasonality": ["spring", "summer"],
                "tags": ["manual-input"],
                "notes": None,
            },
            {
                "id": "manual-2",
                "name": "blue jeans",
                "category": "bottom",
                "color": "blue",
                "material": None,
                "pattern": None,
                "formality": "casual",
                "seasonality": ["spring", "summer"],
                "tags": ["manual-input"],
                "notes": None,
            },
        ],
        "occasion": "Business casual meetup",
        "itinerary": "Coworking then dinner",
        "preferences": "Prefer neutral colors",
    }


def test_analyze_manual_text_returns_schema_valid_json() -> None:
    response = client.post(
        "/api/analyze-closet",
        data={"manual_clothes_text": "white tee, blue jeans, brown loafers"},
    )

    assert response.status_code == 200
    parsed = AnalyzeClosetResponse.model_validate(response.json())
    assert parsed.source == "manual_text"
    assert len(parsed.items) >= 1


def test_generate_outfits_returns_schema_valid_json_with_2_to_4_outfits() -> None:
    response = client.post("/api/generate-outfits", json=build_generate_payload())

    assert response.status_code == 200
    parsed = GenerateOutfitsResponse.model_validate(response.json())
    assert 2 <= len(parsed.outfits) <= 4


def test_analyze_rejects_unsupported_file_type() -> None:
    response = client.post(
        "/api/analyze-closet",
        files=[("files[]", ("closet.txt", b"white tee", "text/plain"))],
    )

    assert response.status_code == 415
    assert "Unsupported file type" in response.json()["detail"]


def test_analyze_rejects_oversized_file() -> None:
    oversized_png = b"x" * ((8 * 1024 * 1024) + 1)
    response = client.post(
        "/api/analyze-closet",
        files=[("files[]", ("oversized.png", oversized_png, "image/png"))],
    )

    assert response.status_code == 413
    assert "exceeds 8MB limit" in response.json()["detail"]


def test_analyze_rejects_too_many_files() -> None:
    files = [
        ("files[]", (f"closet-{index}.png", b"png", "image/png"))
        for index in range(9)
    ]
    response = client.post("/api/analyze-closet", files=files)

    assert response.status_code == 400
    assert "Too many files" in response.json()["detail"]


def test_cors_preflight_allows_configured_origin() -> None:
    response = client.options(
        "/api/analyze-closet",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "POST" in response.headers["access-control-allow-methods"]


def test_generate_outfits_maps_service_errors_to_502() -> None:
    class BrokenGeminiService:
        def analyze_closet(self, *, manual_clothes_text: str | None, images: list) -> None:
            raise AssertionError("Not used in this test")

        def generate_outfits(self, request):  # noqa: ANN001 - simple test double
            raise GeminiServiceError("Gemini upstream timeout.")

    app.dependency_overrides[get_gemini_service] = lambda: BrokenGeminiService()
    try:
        response = client.post("/api/generate-outfits", json=build_generate_payload())
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 502
    assert response.json() == {"detail": "Gemini upstream timeout."}
