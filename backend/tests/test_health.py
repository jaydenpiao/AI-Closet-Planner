from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint_returns_ok() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_closet_requires_at_least_one_input() -> None:
    response = client.post("/api/analyze-closet", data={})
    assert response.status_code == 400
    assert "Provide at least one input" in response.json()["detail"]
