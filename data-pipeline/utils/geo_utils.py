import math

NER_STATES = ['Sikkim', 'Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura']
NER_BOUNDS = {'min_lat': 20.0, 'max_lat': 30.0, 'min_lon': 88.0, 'max_lon': 98.0}

def is_in_ner(lat, lon, buffer=1.0):
    return (
        NER_BOUNDS['min_lat'] - buffer <= lat <= NER_BOUNDS['max_lat'] + buffer and
        NER_BOUNDS['min_lon'] - buffer <= lon <= NER_BOUNDS['max_lon'] + buffer
    )

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def calculate_slope_from_elevations(center, north, south, east, west, offset_deg=0.001):
    \"\"\"Finite difference slope calculation. Returns degrees.\"\"\"
    if None in [center, north, south, east, west]:
        return None
    METERS_PER_DEG = 111000 * offset_deg
    dz_dy = (north - south) / (2 * METERS_PER_DEG)
    dz_dx = (east - west) / (2 * METERS_PER_DEG)
    slope_rad = math.atan(math.sqrt(dz_dx**2 + dz_dy**2))
    return round(math.degrees(slope_rad), 4)

def calculate_aspect(north, south, east, west, offset_deg=0.001):
    \"\"\"Aspect in degrees (0=N, 90=E, 180=S, 270=W)\"\"\"
    if None in [north, south, east, west]:
        return None
    n_s = north - south
    e_w = east - west
    aspect_rad = math.atan2(e_w, n_s)
    return round(math.degrees(aspect_rad) % 360, 2)
