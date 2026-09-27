import joblib
import numpy as np
import json
import os
import shap
from datetime import datetime
from config import settings
from features.feature_engineering import FEATURE_NAMES

class LandslidePredictor:
    def __init__(self):
        self.model = None
        self.model_metadata = None
        self.explainer = None
        self.feature_names = FEATURE_NAMES
        self.training_medians = {}  # For missing feature imputation reference
        self.base_estimator = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained model from disk."""
        model_path = os.path.join(settings.model_dir, 'landslide_rf_model.joblib')
        metadata_path = os.path.join(settings.metadata_dir, 'model_metadata.json')
        medians_path = os.path.join(settings.metadata_dir, 'training_medians.json')
        
        if not os.path.exists(model_path):
            self.model = None
            return
        
        try:
            self.model = joblib.load(model_path)
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    self.model_metadata = json.load(f)
            if os.path.exists(medians_path):
                with open(medians_path, 'r') as f:
                    self.training_medians = json.load(f)
            
            # Find base tree estimator for SHAP and feature importances
            self.base_estimator = None
            if hasattr(self.model, 'calibrated_classifiers_') and len(self.model.calibrated_classifiers_) > 0:
                sub = self.model.calibrated_classifiers_[0]
                self.base_estimator = getattr(sub, 'estimator', getattr(sub, 'base_estimator', None))
            elif hasattr(self.model, 'estimator'):
                self.base_estimator = self.model.estimator
            elif hasattr(self.model, 'feature_importances_'):
                self.base_estimator = self.model

            # Try to build TreeExplainer
            if self.base_estimator is not None:
                try:
                    self.explainer = shap.TreeExplainer(self.base_estimator)
                except Exception as e:
                    print(f"SHAP Explainer setup warning: {e}")
                    self.explainer = None
                    
            print(f"[OK] Landslide model loaded successfully: {metadata_path}")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None

    def predict(self, features: dict, missing: list) -> dict:
        """Run prediction. Returns full result with calibrated probability and SHAP."""
        if self.model is None:
            return {
                'available': False,
                'reason': 'Model not trained. Run python training/train_calibrated.py to train the model.',
                'risk_probability': None,
                'risk_class': None
            }
        
        # Build feature array in consistent order
        feature_vector = []
        used_features = []
        for fname in self.feature_names:
            val = features.get(fname)
            if val is None:
                # Use training median for missing
                val = self.training_medians.get(fname, 0.0)
            feature_vector.append(float(val))
            used_features.append(fname)
        
        X = np.array([feature_vector])
        
        # Get calibrated probability
        probability = float(self.model.predict_proba(X)[0][1])  # P(landslide)
        
        # Get SHAP values
        shap_values = {}
        if self.explainer is not None:
            try:
                sv = self.explainer.shap_values(X)
                if isinstance(sv, list) and len(sv) > 1:
                    shap_arr = sv[1][0]  # class 1 (landslide)
                elif isinstance(sv, np.ndarray) and len(sv.shape) == 3:
                    shap_arr = sv[0, :, 1]
                else:
                    shap_arr = sv[0]
                shap_values = dict(zip(self.feature_names, [round(float(v), 4) for v in shap_arr]))
            except Exception as e:
                shap_values = {}
        
        # Feature importance from model or metadata
        feature_importance = {}
        if self.base_estimator is not None and hasattr(self.base_estimator, 'feature_importances_'):
            feature_importance = dict(zip(
                self.feature_names,
                [round(float(v), 4) for v in self.base_estimator.feature_importances_]
            ))
        elif self.model_metadata and 'feature_importance' in self.model_metadata:
            feature_importance = self.model_metadata['feature_importance']
        
        # Classify risk
        risk_class = self._classify_risk(probability)
        
        # Confidence note if features missing
        confidence_note = None
        if missing:
            confidence_note = f"Prediction confidence reduced. Missing features: {', '.join(missing)}. Training median substituted where applicable."
        
        return {
            'available': True,
            'risk_probability': round(probability, 4),
            'risk_class': risk_class,
            'shap_values': shap_values,
            'feature_importance': feature_importance,
            'model_version': self.model_metadata.get('version_name', 'rf_calibrated_v2.0') if self.model_metadata else 'rf_calibrated_v2.0',
            'features_used': used_features,
            'missing_features': missing,
            'confidence_note': confidence_note,
            'prediction_time': datetime.utcnow().isoformat() + 'Z'
        }
    
    def _classify_risk(self, probability: float) -> str:
        if probability < settings.risk_low_max:
            return 'LOW'
        elif probability < settings.risk_moderate_max:
            return 'MODERATE'
        elif probability < settings.risk_high_max:
            return 'HIGH'
        else:
            return 'CRITICAL'
    
    def get_status(self) -> dict:
        if self.model is None:
            return {'model_loaded': False, 'reason': 'No trained model found'}
        return {
            'model_loaded': True,
            'version': self.model_metadata.get('version_name') if self.model_metadata else 'rf_calibrated_v2.0',
            'algorithm': self.model_metadata.get('algorithm') if self.model_metadata else 'RandomForest (Calibrated)',
            'trained_at': self.model_metadata.get('trained_at') if self.model_metadata else None,
            'features': self.feature_names,
            'metrics': self.model_metadata.get('metrics') if self.model_metadata else None
        }
    
    def reload(self):
        self._load_model()
