FEATURE_NAMES = [
    'rainfall_24h_mm',    # NASA POWER / GPM IMERG
    'rainfall_3d_mm',     # Cumulative 3-day
    'rainfall_7d_mm',     # Cumulative 7-day
    'soil_moisture',      # NASA SMAP volumetric (m3/m3) - may be missing
    'elevation_m',        # SRTM elevation
    'slope_degree',       # Derived from DEM
    'historical_landslide_density',  # events/km2 within 5km
    'historical_landslide_count',    # Raw count within 5km
]

# Which features are REQUIRED (prediction fails if all required missing)
REQUIRED_FEATURES = [
    'rainfall_24h_mm',
    'elevation_m',
    'slope_degree',
]

# Minimum features needed for a prediction
MIN_FEATURES_FOR_PREDICTION = 4

def engineer_features(raw_data: dict) -> dict:
    """
    Take raw environmental data and return feature vector.
    Handles missing values with documented strategy.
    Returns: { features: dict, missing: list, imputation_notes: list }
    """
    features = {}
    missing = []
    imputation_notes = []
    
    # Rainfall features
    for key in ['rainfall_24h_mm', 'rainfall_3d_mm', 'rainfall_7d_mm']:
        val = raw_data.get(key)
        if val is not None and val >= 0:
            features[key] = float(val)
        else:
            missing.append(key)
            # Strategy: if 24h missing but 3d available, estimate 24h as 3d/3
            # Only if makes temporal sense
            if key == 'rainfall_24h_mm' and raw_data.get('rainfall_3d_mm') is not None:
                est = float(raw_data['rainfall_3d_mm']) / 3.0
                features[key] = est
                imputation_notes.append(f'{key} estimated as rainfall_3d_mm/3 (temporal mean)')
                missing.remove(key)
    
    # Soil moisture
    sm = raw_data.get('soil_moisture')
    if sm is not None and 0 <= sm <= 1:
        features['soil_moisture'] = float(sm)
    else:
        missing.append('soil_moisture')
        # Soil moisture: do NOT impute with random value
        # Use median from training data if model is loaded
        # Otherwise skip (model handles via feature importance)
        imputation_notes.append('soil_moisture unavailable - feature excluded from this prediction')
    
    # Terrain
    elev = raw_data.get('elevation_m')
    if elev is not None:
        features['elevation_m'] = float(elev)
    else:
        missing.append('elevation_m')
    
    slope = raw_data.get('slope_degree')
    if slope is not None and slope >= 0:
        features['slope_degree'] = float(slope)
    else:
        missing.append('slope_degree')
    
    # Historical density
    density = raw_data.get('historical_landslide_density')
    count = raw_data.get('historical_landslide_count', 0)
    features['historical_landslide_density'] = float(density) if density is not None else 0.0
    features['historical_landslide_count'] = float(count) if count is not None else 0.0
    
    return {
        'features': features,
        'missing': missing,
        'imputation_notes': imputation_notes
    }
