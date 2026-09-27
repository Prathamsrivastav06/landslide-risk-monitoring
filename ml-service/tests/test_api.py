from fastapi.testclient import TestClient
import sys
import os

# Add root dir to sys path for pytest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, predictor

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "online"

def test_predict_valid_features(monkeypatch):
    # Mock the predictor model to avoid needing a real model loaded
    class MockPredictor:
        def predict(self, features, missing):
            return {
                "available": True,
                "risk_probability": 0.85,
                "risk_class": "HIGH",
                "features_used": list(features.keys())
            }
    monkeypatch.setattr("app.predictor", MockPredictor())
    
    payload = {
        "lat": 27.0,
        "lon": 88.0,
        "rainfall_24h_mm": 120.5,
        "elevation_m": 1200.0,
        "slope_degree": 35.0,
        "soil_moisture": 0.4
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is True
    assert data["risk_class"] == "HIGH"

def test_predict_empty_features():
    payload = {
        "lat": 27.0,
        "lon": 88.0
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is False
    assert "Insufficient data" in data["reason"]

def test_model_status():
    response = client.get("/model/status")
    assert response.status_code == 200
    assert "model_loaded" in response.json()
