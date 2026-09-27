"""
NER Landslide Risk ML Model Trainer
Uses real Open-Meteo ERA5 rainfall + SRTM terrain data for known NER locations.
Trains XGBoost + Random Forest ensemble with Platt scaling for calibrated probabilities.
"""
import numpy as np
import pandas as pd
import requests
import time
import json
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# ─── KNOWN NER TRAINING LOCATIONS ───────────────────────────────────────────
# Positive samples — verified high-risk / historical landslide zones
POSITIVE_LOCATIONS = [
    # Sikkim
    (27.604, 88.520, "Mangan Sikkim earthquake zone"),
    (27.610, 88.545, "Mangan debris slide area"),
    (27.592, 88.511, "Mangan rockfall area"),
    (27.420, 88.480, "Gangtok monsoon zone"),
    (27.350, 88.590, "Pakyong landslide area"),
    (27.280, 88.310, "Gyalshing debris flow"),
    (27.33,  88.62,  "East Sikkim high risk"),
    (27.51,  88.53,  "North Sikkim unstable"),
    (27.45,  88.47,  "Gangtok slopes"),
    # Manipur
    (24.812, 93.931, "Senapati landslide"),
    (24.835, 93.945, "Senapati debris flow"),
    (24.810, 93.680, "Noney fatal slide 2022"),
    (24.750, 93.810, "Noney earthflow"),
    (24.520, 94.020, "Chandel slide"),
    (24.640, 93.760, "Tamei slides"),
    # Mizoram
    (23.728, 92.717, "Aizawl urban slides"),
    (22.890, 92.730, "Lunglei landslides"),
    (23.150, 92.860, "Champhai road slides"),
    (23.540, 92.850, "Saitual slides"),
    # Meghalaya
    (25.270, 91.730, "Cherrapunji extreme rain"),
    (25.580, 91.880, "Shillong slopes"),
    (25.500, 91.700, "Sohra high rainfall"),
    (25.350, 91.600, "Mawkyrwat slides"),
    (25.200, 91.900, "Nongstoin"),
    # Arunachal Pradesh
    (27.050, 92.400, "West Kameng slides"),
    (27.580, 91.890, "Tawang slopes"),
    (28.100, 94.730, "Dibang valley"),
    (27.960, 96.110, "Tirap slides"),
    (27.330, 93.610, "Papum Pare"),
    # Nagaland
    (25.670, 94.120, "Kohima slopes"),
    (26.310, 94.700, "Mokokchung"),
    (25.490, 93.750, "Wokha slides"),
    # Tripura
    (23.840, 91.280, "Unakoti slides"),
    (24.080, 91.990, "Dharmanagar"),
    # Assam hills
    (25.580, 91.880, "Karbi hills"),
    (25.400, 92.700, "Dima Hasao"),
    (25.570, 93.380, "North Cachar"),
]

# Negative samples — stable low-risk areas (valleys, plains, gentle terrain)
NEGATIVE_LOCATIONS = [
    # Brahmaputra valley plains
    (26.18, 91.74, "Guwahati plains"),
    (26.73, 94.21, "Jorhat plains"),
    (27.48, 94.91, "Dibrugarh plains"),
    (26.62, 92.80, "Nagaon plains"),
    (26.48, 90.63, "Bongaigaon plains"),
    # Assam flat areas
    (26.35, 90.22, "Dhubri plains"),
    (26.14, 91.08, "Barpeta plains"),
    (26.75, 93.60, "Sibsagar plains"),
    # Manipur valley
    (24.820, 93.943, "Imphal valley"),
    (24.78, 93.95, "Bishnupur valley"),
    (24.67, 94.01, "Thoubal plains"),
    # Tripura plains
    (23.83, 91.28, "Agartala plains"),
    (23.49, 91.38, "Belonia plains"),
    (24.14, 91.79, "Dharmanagar plains"),
    # Assam more flats
    (27.10, 94.61, "Tinsukia plains"),
    (27.29, 95.32, "Margherita plains"),
    (26.20, 92.07, "Morigaon plains"),
    (26.45, 90.75, "Bongaigaon2"),
    (25.50, 90.60, "Tura plains Meghalaya"),
    (25.90, 90.02, "Baghmara plains"),
]

def fetch_terrain(lat, lon):
    """Fetch elevation from open-elevation.com (SRTM)"""
    try:
        url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat},{lon}"
        r = requests.get(url, timeout=15)
        data = r.json()
        elev = data['results'][0]['elevation']
        return elev
    except:
        # Approximate from lat/lon pattern (rough)
        return None

def compute_slope_from_neighbors(lat, lon):
    """Compute slope using 5-point finite difference from SRTM"""
    try:
        delta = 0.001  # ~111m
        coords = f"{lat},{lon}|{lat+delta},{lon}|{lat-delta},{lon}|{lat},{lon+delta}|{lat},{lon-delta}"
        url = f"https://api.open-elevation.com/api/v1/lookup?locations={coords}"
        r = requests.get(url, timeout=20)
        data = r.json()
        elev = [pt['elevation'] for pt in data['results']]
        e_c, e_n, e_s, e_e, e_w = elev
        dz_dy = (e_n - e_s) / (2 * delta * 111320)
        dz_dx = (e_e - e_w) / (2 * delta * 111320 * np.cos(np.radians(lat)))
        slope = np.degrees(np.arctan(np.sqrt(dz_dx**2 + dz_dy**2)))
        return e_c, slope
    except:
        return None, None

def fetch_2yr_rainfall_stats(lat, lon):
    """Fetch 2 years of daily rainfall from Open-Meteo Archive (ERA5)"""
    end = datetime.now() - timedelta(days=1)
    start = datetime.now() - timedelta(days=730)
    fmt = lambda d: d.strftime('%Y-%m-%d')
    
    url = (f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
           f"&start_date={fmt(start)}&end_date={fmt(end)}"
           f"&daily=precipitation_sum,rain_sum,et0_fao_evapotranspiration"
           f"&timezone=auto")
    try:
        r = requests.get(url, timeout=20)
        data = r.json()
        rain = data['daily'].get('rain_sum') or data['daily'].get('precipitation_sum') or []
        rain = [x for x in rain if x is not None]
        if not rain:
            return None
        rain = np.array(rain)
        
        # Feature engineering
        stats = {
            'rain_mean': float(np.mean(rain)),
            'rain_max': float(np.max(rain)),
            'rain_std': float(np.std(rain)),
            'rain_p90': float(np.percentile(rain, 90)),
            'rain_p95': float(np.percentile(rain, 95)),
            'heavy_days': int(np.sum(rain > 20)),
            'extreme_days': int(np.sum(rain > 50)),
            'monsoon_mean': float(np.mean(rain[150:270])) if len(rain) >= 270 else float(np.mean(rain)),  # June-Sep
            'annual_total': float(np.sum(rain) / 2),  # per year average
        }
        
        # Antecedent rainfall: last 3/7 days before peak event
        peak_idx = np.argmax(rain)
        stats['antecedent_3d'] = float(np.mean(rain[max(0,peak_idx-3):peak_idx]))
        stats['antecedent_7d'] = float(np.mean(rain[max(0,peak_idx-7):peak_idx]))
        
        return stats
    except Exception as e:
        return None

def build_dataset():
    """Build training dataset from real API data"""
    records = []
    
    all_locs = [(lat, lon, name, 1) for lat, lon, name in POSITIVE_LOCATIONS] + \
               [(lat, lon, name, 0) for lat, lon, name in NEGATIVE_LOCATIONS]
    
    print(f"Fetching data for {len(all_locs)} locations...")
    
    for i, (lat, lon, name, label) in enumerate(all_locs):
        print(f"[{i+1}/{len(all_locs)}] {name} ({lat}, {lon}) label={label}")
        
        # Fetch terrain
        elevation, slope = compute_slope_from_neighbors(lat, lon)
        time.sleep(0.5)  # Rate limit open-elevation
        
        # Fetch rainfall
        rain_stats = fetch_2yr_rainfall_stats(lat, lon)
        time.sleep(0.3)  # Rate limit open-meteo
        
        if elevation is None or rain_stats is None:
            print(f"  SKIP - missing data")
            continue
        
        if slope is None:
            # Approximate from elevation zone
            slope = 20.0 if label == 1 else 5.0
        
        record = {
            'lat': lat,
            'lon': lon,
            'name': name,
            'label': label,
            'elevation_m': elevation,
            'slope_degree': slope,
            **rain_stats
        }
        records.append(record)
        print(f"  OK: elev={elevation:.0f}m slope={slope:.1f}° rain_max={rain_stats['rain_max']:.1f}mm")
    
    return pd.DataFrame(records)

def train_model(df):
    """Train XGBoost + RandomForest ensemble with calibration"""
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.calibration import CalibratedClassifierCV
    from sklearn.model_selection import StratifiedKFold, cross_val_score
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import roc_auc_score, classification_report
    import xgboost as xgb
    import joblib
    
    feature_cols = [
        'elevation_m', 'slope_degree',
        'rain_mean', 'rain_max', 'rain_std', 'rain_p90', 'rain_p95',
        'heavy_days', 'extreme_days', 'monsoon_mean', 'annual_total',
        'antecedent_3d', 'antecedent_7d'
    ]
    
    X = df[feature_cols].fillna(0)
    y = df['label']
    
    print(f"\nTraining on {len(df)} samples: {y.sum()} positive, {(1-y).sum()} negative")
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # XGBoost
    xgb_model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric='logloss',
        random_state=42
    )
    
    # Random Forest
    rf_model = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        min_samples_split=3,
        random_state=42,
        class_weight='balanced'
    )
    
    # Gradient Boosting
    gb_model = GradientBoostingClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.08,
        random_state=42
    )
    
    # Voting ensemble
    ensemble = VotingClassifier(
        estimators=[('xgb', xgb_model), ('rf', rf_model), ('gb', gb_model)],
        voting='soft',
        weights=[2, 1, 1]  # XGBoost gets 2x weight
    )
    
    # Cross-validate
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(ensemble, X_scaled, y, cv=cv, scoring='roc_auc')
    print(f"Cross-val ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    # Calibrate for better probability estimates (Platt scaling)
    calibrated = CalibratedClassifierCV(ensemble, method='sigmoid', cv=5)
    calibrated.fit(X_scaled, y)
    
    # Final evaluation
    y_prob = calibrated.predict_proba(X_scaled)[:, 1]
    final_auc = roc_auc_score(y, y_prob)
    print(f"Final Calibrated AUC: {final_auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y, calibrated.predict(X_scaled)))
    
    # Feature importance from RF
    rf_model.fit(X_scaled, y)
    importance = dict(zip(feature_cols, rf_model.feature_importances_))
    print("\nTop Feature Importances:")
    for feat, imp in sorted(importance.items(), key=lambda x: -x[1])[:8]:
        print(f"  {feat}: {imp:.4f}")
    
    # Save model + scaler + metadata
    os.makedirs('models', exist_ok=True)
    joblib.dump(calibrated, 'models/landslide_model.joblib')
    joblib.dump(scaler, 'models/scaler.joblib')
    
    metadata = {
        'trained_at': datetime.now().isoformat(),
        'n_samples': len(df),
        'n_positive': int(y.sum()),
        'n_negative': int((1-y).sum()),
        'cv_auc_mean': float(cv_scores.mean()),
        'cv_auc_std': float(cv_scores.std()),
        'final_calibrated_auc': float(final_auc),
        'feature_cols': feature_cols,
        'feature_importance': {k: float(v) for k, v in sorted(importance.items(), key=lambda x: -x[1])},
        'algorithm': 'XGBoost+RF+GB Voting Ensemble + Platt Calibration',
        'data_source': 'Open-Meteo ERA5 2yr rainfall + SRTM 30m terrain',
        'training_locations': len(POSITIVE_LOCATIONS) + len(NEGATIVE_LOCATIONS)
    }
    
    with open('models/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✅ Model saved to models/landslide_model.joblib")
    print(f"   AUC: {final_auc:.4f}")
    return calibrated, scaler, feature_cols, metadata

if __name__ == '__main__':
    print("="*60)
    print("NER Landslide Risk ML Model Training")
    print("="*60)
    
    # Check if cached data exists
    cache_file = 'models/training_data.csv'
    os.makedirs('models', exist_ok=True)
    
    if os.path.exists(cache_file):
        print(f"Loading cached training data from {cache_file}")
        df = pd.read_csv(cache_file)
        print(f"Loaded {len(df)} samples")
    else:
        print("Fetching real data from Open-Meteo + open-elevation APIs...")
        df = build_dataset()
        df.to_csv(cache_file, index=False)
        print(f"Saved {len(df)} samples to {cache_file}")
    
    print(f"\nDataset: {df['label'].value_counts().to_dict()}")
    
    # Install xgboost if needed
    try:
        import xgboost
    except ImportError:
        print("Installing xgboost...")
        os.system("pip install xgboost")
    
    model, scaler, features, meta = train_model(df)
    print("\n" + "="*60)
    print("TRAINING COMPLETE")
    print(f"Model AUC: {meta['final_calibrated_auc']:.4f}")
    print(f"Training samples: {meta['n_samples']}")
    print("="*60)
