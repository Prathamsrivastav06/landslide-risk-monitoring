"""
Train the Landslide Risk Classification Model.

Algorithm: Random Forest Classifier (primary)
Validation: Time-aware split (train: pre-2020, test: 2020+)
Explainability: SHAP TreeExplainer
Output: models/landslide_rf_model.joblib + metadata JSON
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import shap
import joblib
import json
from datetime import datetime
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings
from features.feature_engineering import FEATURE_NAMES

def train_model(data_path='./training/training_data.csv'):
    if not os.path.exists(data_path):
        print(f"ERROR: Training data not found at {data_path}")
        print("Run: python training/generate_training_data.py first")
        sys.exit(1)
    
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} training samples")
    print(f"  Positive: {df['landslide_occurred'].sum()}")
    print(f"  Negative: {(df['landslide_occurred'] == 0).sum()}")
    
    # Features available
    available_features = [f for f in FEATURE_NAMES if f in df.columns]
    print(f"\nFeatures: {available_features}")
    
    X = df[available_features].copy()
    y = df['landslide_occurred'].astype(int)
    
    # Handle missing values: median imputation (documented)
    medians = X.median()
    X_filled = X.fillna(medians)
    training_medians = medians.to_dict()
    
    # Time-aware split (prevent data leakage)
    if 'year' in df.columns:
        train_mask = df['year'] < 2020
        test_mask = df['year'] >= 2020
        
        if train_mask.sum() < 50 or test_mask.sum() < 10:
            # Fallback: use 80/20 split if not enough temporal data
            from sklearn.model_selection import train_test_split
            X_train, X_test, y_train, y_test = train_test_split(
                X_filled, y, test_size=0.2, random_state=42, stratify=y
            )
            validation_method = 'stratified_80_20_split'
        else:
            X_train, y_train = X_filled[train_mask], y[train_mask]
            X_test, y_test = X_filled[test_mask], y[test_mask]
            validation_method = 'temporal_split_pre2020_train_2020plus_test'
    else:
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            X_filled, y, test_size=0.2, random_state=42, stratify=y
        )
        validation_method = 'stratified_80_20_split'
    
    print(f"\nValidation strategy: {validation_method}")
    print(f"Train: {len(X_train)} | Test: {len(X_test)}")
    
    # Train Random Forest
    # class_weight='balanced' handles imbalanced data
    model = RandomForestClassifier(
        n_estimators=settings.n_estimators,
        max_depth=settings.max_depth,
        min_samples_split=settings.min_samples_split,
        class_weight='balanced',  # handles class imbalance
        random_state=settings.random_state,
        n_jobs=-1
    )
    
    print("\nTraining Random Forest...")
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    try:
        roc_auc = roc_auc_score(y_test, y_prob)
    except:
        roc_auc = None
    
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    print(f"\n=== MODEL EVALUATION ===")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}" if roc_auc else "ROC-AUC: N/A")
    print(f"Confusion Matrix:")
    print(f"  TN={cm[0][0]}, FP={cm[0][1]}")
    print(f"  FN={cm[1][0]}, TP={cm[1][1]}")
    print(f"\nNote: Prioritize recall (missing a real event is more dangerous than false alarm)")
    print(classification_report(y_test, y_pred, target_names=['No Landslide', 'Landslide']))
    
    # Feature importance
    feature_importance = dict(zip(available_features, model.feature_importances_.tolist()))
    print(f"\nFeature Importance:")
    for feat, imp in sorted(feature_importance.items(), key=lambda x: -x[1]):
        print(f"  {feat}: {imp:.4f}")
    
    # SHAP summary (on test set sample)
    print("\nComputing SHAP values...")
    explainer = shap.TreeExplainer(model)
    shap_sample = X_test.head(min(100, len(X_test)))
    try:
        shap_values = explainer.shap_values(shap_sample)
        if isinstance(shap_values, list):
            shap_arr = np.abs(shap_values[1]).mean(axis=0)
        else:
            shap_arr = np.abs(shap_values).mean(axis=0)
        shap_importance = dict(zip(available_features, shap_arr.tolist()))
        print("SHAP mean |value| per feature:")
        for feat, val in sorted(shap_importance.items(), key=lambda x: -x[1]):
            print(f"  {feat}: {val:.4f}")
    except Exception as e:
        print(f"SHAP computation failed: {e}")
        shap_importance = {}
    
    # Version name
    version_name = f"rf_v{datetime.now().strftime('%Y%m%d_%H%M')}"
    
    # Save model
    os.makedirs(settings.model_dir, exist_ok=True)
    os.makedirs(settings.metadata_dir, exist_ok=True)
    
    model_path = os.path.join(settings.model_dir, 'landslide_rf_model.joblib')
    joblib.dump(model, model_path)
    print(f"\nModel saved: {model_path}")
    
    # Save metadata
    metadata = {
        'version_name': version_name,
        'algorithm': 'RandomForestClassifier',
        'trained_at': datetime.utcnow().isoformat(),
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'positive_samples': int(y.sum()),
        'negative_samples': int((y == 0).sum()),
        'precision': round(precision, 4),
        'recall': round(recall, 4),
        'f1': round(f1, 4),
        'roc_auc': round(roc_auc, 4) if roc_auc else None,
        'confusion_matrix': cm,
        'feature_importance': feature_importance,
        'shap_importance': shap_importance,
        'features_used': available_features,
        'validation_method': validation_method,
        'hyperparameters': {
            'n_estimators': settings.n_estimators,
            'max_depth': settings.max_depth,
            'min_samples_split': settings.min_samples_split,
            'class_weight': 'balanced'
        },
        'training_medians': training_medians,
        'notes': (
            "IMPORTANT: These metrics are from model validation on held-out data. "
            "Performance on real future events may differ. "
            "This is a prototype model for SIH evaluation. "
            "Thresholds (LOW/MODERATE/HIGH/CRITICAL) are prototype configurations, "
            "not officially calibrated government thresholds."
        )
    }
    
    meta_path = os.path.join(settings.metadata_dir, 'model_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved: {meta_path}")
    
    # Also save medians for inference
    medians_path = os.path.join(settings.metadata_dir, 'training_medians.json')
    with open(medians_path, 'w') as f:
        json.dump(training_medians, f, indent=2)
    
    return model, metadata

if __name__ == '__main__':
    train_model()
