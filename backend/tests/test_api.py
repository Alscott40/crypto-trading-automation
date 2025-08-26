from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ping():
    response = client.get("/api/ping")
    assert response.status_code == 200
    assert response.json() == {"message": "pong"}

def test_get_exchange_status():
    response = client.get("/api/exchanges/status")
    assert response.status_code == 200
    assert response.json() == {}
