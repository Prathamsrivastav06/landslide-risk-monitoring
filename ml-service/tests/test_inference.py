import pytest
from inference.predictor import LandslidePredictor
import json
import os

class MockModel:
    def __init__(self):
        self.feature_importances_ = [0.1] * 8
        self.n_estimators = 200
        
    def predict_proba(self, X):
        return [[0.1, 0.9]]  # Return high probability

class MockExplainer:
    def shap_values(self, X):
        return [[0.1] * 8, [0.2] * 8]

@pytest.fixture
def predictor(monkeypatch):
    p = LandslidePredictor()
    p.model = MockModel()
    p.explainer = MockExplainer()
    p.model_metadata = {'version_name': 'mock_v1'}
    p.training_medians = {'soil_moisture': 0.3}
    return p

def test_predict_full_features(predictor):
    features = {
        'rainfall_24h_mm': 100,
        'rainfall_3d_mm': 150,
        'rainfall_7d_mm': 200,
        'soil_moisture': 0.4,
        'elevation_m': 1000,
        'slope_degree': 30,
        'historical_landslide_density': 0.1,
        'historical_landslide_count': 1
    }
    missing = []
    
    res = predictor.predict(features, missing)
    assert res['available'] is True
    assert res['risk_probability'] == 0.9
    assert res['risk_class'] == 'CRITICAL'
    assert 'shap_values' in res
    assert 'feature_importance' in res

def test_predict_missing_soil_moisture(predictor):
    features = {
        'rainfall_24h_mm': 100,
        'rainfall_3d_mm': 150,
        'rainfall_7d_mm': 200,
        'elevation_m': 1000,
        'slope_degree': 30,
        'historical_landslide_density': 0.1,
        'historical_landslide_count': 1
    }
    missing = ['soil_moisture']
    
    res = predictor.predict(features, missing)
    assert res['available'] is True
    assert res['confidence_note'] is not None
    assert 'soil_moisture' in res['confidence_note']
    # Uses median 0.3 fallback
    assert 'soil_moisture' in res['missing_features']

def test_predict_no_model():
    p = LandslidePredictor()
    p.model = None
    res = p.predict({'elevation_m': 100}, [])
    assert res['available'] is False
    assert 'Model not trained' in res['reason']

def test_model_status(predictor):
    status = predictor.get_status()
    assert status['model_loaded'] is True
    assert status['version'] == 'mock_v1'
