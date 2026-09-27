import pytest
from features.feature_engineering import engineer_features
from features.feature_validator import validate_features

def test_engineer_features_full():
    raw_data = {
        'rainfall_24h_mm': 50,
        'rainfall_3d_mm': 120,
        'rainfall_7d_mm': 200,
        'soil_moisture': 0.5,
        'elevation_m': 1500,
        'slope_degree': 45,
        'historical_landslide_density': 0.2,
        'historical_landslide_count': 2
    }
    res = engineer_features(raw_data)
    assert len(res['missing']) == 0
    assert len(res['features']) == 8
    assert res['features']['rainfall_24h_mm'] == 50

def test_engineer_features_missing_24h_imputed():
    raw_data = {
        'rainfall_3d_mm': 120,
        'elevation_m': 1500,
        'slope_degree': 45
    }
    res = engineer_features(raw_data)
    assert 'rainfall_24h_mm' in res['features']
    assert res['features']['rainfall_24h_mm'] == 40.0  # 120 / 3
    assert len(res['imputation_notes']) > 0

def test_validate_features_sufficient():
    features = {
        'rainfall_24h_mm': 50,
        'elevation_m': 1500,
        'slope_degree': 45,
        'historical_landslide_count': 1
    }
    res = validate_features(features, ['soil_moisture', 'rainfall_3d_mm', 'rainfall_7d_mm', 'historical_landslide_density'])
    assert res['valid'] is True

def test_validate_features_insufficient():
    features = {
        'rainfall_24h_mm': 50,
        'elevation_m': 1500
    }
    # missing slope_degree (required)
    res = validate_features(features, ['slope_degree', 'soil_moisture'])
    assert res['valid'] is False
    assert 'Insufficient data' in res['reason']
