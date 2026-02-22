from __future__ import annotations

import pytest

from app.core.config import Settings
from app.models.schemas import AnalyzeClosetLLMResponse
from app.services.gemini_service import (
    GeminiResponseFormatError,
    GeminiService,
    GeminiServiceError,
)


def build_service() -> GeminiService:
    settings = Settings(_env_file=None, GEMINI_MOCK_MODE=True)
    return GeminiService(settings)


def test_generate_json_with_retry_recovers_after_format_error(monkeypatch: pytest.MonkeyPatch) -> None:
    service = build_service()
    expected = AnalyzeClosetLLMResponse(summary="ok", items=[], warnings=[])
    calls = {"count": 0}

    def fake_generate_json_once(*, prompt: str, images: list, schema_model):  # noqa: ANN001
        calls["count"] += 1
        if calls["count"] == 1:
            raise GeminiResponseFormatError("invalid JSON")
        return expected

    monkeypatch.setattr(service, "_generate_json_once", fake_generate_json_once)

    parsed = service._generate_json_with_retry(
        prompt="test prompt",
        images=[],
        schema_model=AnalyzeClosetLLMResponse,
    )

    assert parsed == expected
    assert calls["count"] == 2


def test_generate_json_with_retry_does_not_retry_service_errors(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = build_service()
    calls = {"count": 0}

    def fake_generate_json_once(*, prompt: str, images: list, schema_model):  # noqa: ANN001
        calls["count"] += 1
        raise GeminiServiceError("network failure")

    monkeypatch.setattr(service, "_generate_json_once", fake_generate_json_once)

    with pytest.raises(GeminiServiceError):
        service._generate_json_with_retry(
            prompt="test prompt",
            images=[],
            schema_model=AnalyzeClosetLLMResponse,
        )

    assert calls["count"] == 1


def test_parse_json_payload_accepts_fenced_json() -> None:
    service = build_service()
    payload = service._parse_json_payload(
        """```json
{"summary":"ok","items":[],"warnings":[]}
```"""
    )

    assert payload["summary"] == "ok"


def test_parse_json_payload_rejects_invalid_json() -> None:
    service = build_service()

    with pytest.raises(GeminiResponseFormatError):
        service._parse_json_payload("not-json")
