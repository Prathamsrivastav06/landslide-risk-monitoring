def validate_coordinate(lat, lon):
    \"\"\"Validate lat/lon are real numbers in valid ranges.\"\"\"
    try:
        lat, lon = float(lat), float(lon)
        if not (-90 <= lat <= 90):
            return False, f'Latitude {lat} out of range'
        if not (-180 <= lon <= 180):
            return False, f'Longitude {lon} out of range'
        if lat == 0 and lon == 0:
            return False, 'Null island coordinates (0,0)'
        return True, None
    except (TypeError, ValueError) as e:
        return False, str(e)

def validate_date(date_str):
    \"\"\"Validate and parse date string. Returns (date_obj, None) or (None, error).\"\"\"
    if not date_str or str(date_str) in ('nan', 'None', 'NaT', ''):
        return None, 'No date'
    try:
        import pandas as pd
        ts = pd.Timestamp(date_str)
        if ts.year < 1900 or ts.year > 2030:
            return None, f'Year {ts.year} out of reasonable range'
        return ts.date(), None
    except Exception as e:
        return None, str(e)
