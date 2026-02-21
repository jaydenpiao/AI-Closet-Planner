from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint_returns_ok() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_allows_configured_cors_origin() -> None:
    response = client.get("/api/health", headers={"Origin": "http://localhost:5174"})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5174"


def test_health_disallows_unknown_cors_origin() -> None:
    response = client.get("/api/health", headers={"Origin": "http://evil.local:5174"})
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


def test_analyze_closet_requires_at_least_one_input() -> None:
    response = client.post("/api/analyze-closet", data={})
    assert response.status_code == 400
    assert "Provide at least one input" in response.json()["detail"]
