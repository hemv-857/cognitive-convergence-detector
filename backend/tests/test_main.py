from fastapi import status


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data


def test_api_version(client):
    response = client.get("/api/v1/stats/summary")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_signals" in data
    assert "total_alerts" in data
