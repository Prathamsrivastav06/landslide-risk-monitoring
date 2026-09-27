from .feature_engineering import REQUIRED_FEATURES, MIN_FEATURES_FOR_PREDICTION, FEATURE_NAMES

def validate_features(features: dict, missing: list) -> dict:
    """
    Check if we have sufficient features for a reliable prediction.
    Returns: { valid: bool, reason: str | None }
    """
    # Check if any required feature is missing
    critical_missing = [f for f in REQUIRED_FEATURES if f in missing]
    
    available_count = len([f for f in FEATURE_NAMES if f in features and features[f] is not None])
    
    if len(critical_missing) == len(REQUIRED_FEATURES):
        return {
            'valid': False,
            'reason': f'Insufficient data for reliable risk estimation. Critical features missing: {critical_missing}'
        }
    
    if available_count < MIN_FEATURES_FOR_PREDICTION:
        return {
            'valid': False,
            'reason': f'Only {available_count} of {len(FEATURE_NAMES)} features available. Minimum required: {MIN_FEATURES_FOR_PREDICTION}'
        }
    
    return {'valid': True, 'reason': None}
