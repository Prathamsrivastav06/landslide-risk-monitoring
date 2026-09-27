from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import os
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

from config import settings
from features.feature_engineering import engineer_features
from features.feature_validator import validate_features
from inference.predictor import LandslidePredictor

app = FastAPI(
    title="Landslide Risk ML Service",
    description="AI risk prediction for landslide early warning (SIH 2026)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

predictor = LandslidePredictor()

class PredictRequest(BaseModel):
    lat: float
    lon: float
    features: Optional[Dict[str, Any]] = None
    rainfall_24h_mm: Optional[float] = None
    rainfall_3d_mm: Optional[float] = None
    rainfall_7d_mm: Optional[float] = None
    soil_moisture: Optional[float] = None
    elevation_m: Optional[float] = None
    slope_degree: Optional[float] = None
    historical_landslide_count: Optional[int] = None
    historical_landslide_density: Optional[float] = None

@app.get("/health")
def health():
    return {"status": "online", "model_loaded": predictor.model is not None, "timestamp": datetime.utcnow().isoformat()}

@app.post("/predict")
def predict(request: PredictRequest):
    raw_data = request.dict()
    
    # Merge nested features and normalize aliases
    if raw_data.get('features') and isinstance(raw_data['features'], dict):
        f = raw_data['features']
        for k, v in f.items():
            if raw_data.get(k) is None:
                raw_data[k] = v
        if raw_data.get('rainfall_24h_mm') is None and f.get('rainfall_24h') is not None:
            raw_data['rainfall_24h_mm'] = f['rainfall_24h']
        if raw_data.get('rainfall_3d_mm') is None and f.get('rainfall_3d') is not None:
            raw_data['rainfall_3d_mm'] = f['rainfall_3d']
        if raw_data.get('rainfall_7d_mm') is None and f.get('rainfall_7d') is not None:
            raw_data['rainfall_7d_mm'] = f['rainfall_7d']
        if raw_data.get('elevation_m') is None and f.get('elevation') is not None:
            raw_data['elevation_m'] = f['elevation']
        if raw_data.get('slope_degree') is None and f.get('slope') is not None:
            raw_data['slope_degree'] = f['slope']
        if raw_data.get('historical_landslide_density') is None and f.get('historical_density') is not None:
            raw_data['historical_landslide_density'] = f['historical_density']
        if raw_data.get('historical_landslide_count') is None and f.get('historical_count') is not None:
            raw_data['historical_landslide_count'] = f['historical_count']
    
    # Engineer features
    eng = engineer_features(raw_data)
    features = eng['features']
    missing = eng['missing']
    imputation_notes = eng['imputation_notes']
    
    # Validate
    validation = validate_features(features, missing)
    if not validation['valid']:
        return {
            'available': False,
            'reason': validation['reason'],
            'missing_features': missing,
            'lat': request.lat,
            'lon': request.lon
        }
    
    # Predict
    result = predictor.predict(features, missing)
    result['imputation_notes'] = imputation_notes
    result['lat'] = request.lat
    result['lon'] = request.lon
    
    return result

@app.get("/model/status")
def model_status():
    return predictor.get_status()

@app.get("/model/metrics")
def model_metrics():
    meta_path = os.path.join(settings.metadata_dir, 'model_metadata.json')
    if not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail="Model not trained yet")
    with open(meta_path, 'r') as f:
        metadata = json.load(f)
    return {
        'version_name': metadata.get('version_name'),
        'trained_at': metadata.get('trained_at'),
        'training_samples': metadata.get('training_samples'),
        'metrics': {
            'precision': metadata.get('precision'),
            'recall': metadata.get('recall'),
            'f1': metadata.get('f1'),
            'roc_auc': metadata.get('roc_auc')
        },
        'confusion_matrix': metadata.get('confusion_matrix'),
        'feature_importance': metadata.get('feature_importance'),
        'features_used': metadata.get('features_used'),
        'validation_method': metadata.get('validation_method'),
        'notes': metadata.get('notes'),
        'hyperparameters': metadata.get('hyperparameters')
    }

@app.post("/model/reload")
def reload_model():
    predictor.reload()
    return {"message": "Model reloaded", "model_loaded": predictor.model is not None}
