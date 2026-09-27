import argparse
import sys
import os
import requests
import time
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data_pipeline.utils.db_utils import get_connection, save_terrain_feature
from data_pipeline.utils.geo_utils import NER_BOUNDS, calculate_slope_from_elevations, calculate_aspect
from data_pipeline.utils.logging_utils import setup_logger

logger = setup_logger('ingest_dem')

def get_elevations_batch(locations):
    url = "https://api.open-elevation.com/api/v1/lookup"
    payload = {
        "locations": [{"latitude": lat, "longitude": lon} for lat, lon in locations]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        
        results = {}
        for item in data.get('results', []):
            lat = item.get('latitude')
            lon = item.get('longitude')
            elev = item.get('elevation')
            results[(lat, lon)] = elev
            
        return results
    except Exception as e:
        logger.error(f"Error fetching elevations: {e}")
        return {}

def process_point(lat, lon, offset_deg=0.001):
    # We need 5 points: center, N, S, E, W
    points = [
        (lat, lon),
        (lat + offset_deg, lon), # North
        (lat - offset_deg, lon), # South
        (lat, lon + offset_deg), # East
        (lat, lon - offset_deg)  # West
    ]
    
    # We could batch these 5 points
    elevations = get_elevations_batch(points)
    
    center_el = elevations.get((lat, lon))
    north_el = elevations.get((lat + offset_deg, lon))
    south_el = elevations.get((lat - offset_deg, lon))
    east_el = elevations.get((lat, lon + offset_deg))
    west_el = elevations.get((lat, lon - offset_deg))
    
    if center_el is None:
        return None
        
    slope = calculate_slope_from_elevations(center_el, north_el, south_el, east_el, west_el, offset_deg)
    aspect = calculate_aspect(north_el, south_el, east_el, west_el, offset_deg)
    
    return {
        'elevation': center_el,
        'slope': slope,
        'aspect': aspect
    }

def main():
    parser = argparse.ArgumentParser(description="Ingest DEM data from Open-Elevation")
    parser.add_argument('--lat', type=float, help="Latitude")
    parser.add_argument('--lon', type=float, help="Longitude")
    parser.add_argument('--grid-ner', action='store_true', help="Fetch for NER grid (0.25 degree spacing)")
    
    args = parser.parse_args()
    
    if not (args.grid_ner or (args.lat is not None and args.lon is not None)):
        parser.error("Must provide either --lat/--lon or --grid-ner")
        
    points = []
    if args.grid_ner:
        lats = np.arange(NER_BOUNDS['min_lat'], NER_BOUNDS['max_lat'] + 0.25, 0.25)
        lons = np.arange(NER_BOUNDS['min_lon'], NER_BOUNDS['max_lon'] + 0.25, 0.25)
        for lat in lats:
            for lon in lons:
                points.append((round(lat, 2), round(lon, 2)))
        logger.info(f"Generated {len(points)} grid points for NER")
    else:
        points = [(args.lat, args.lon)]
        
    conn = get_connection()
    if not conn:
        logger.error("Failed to connect to database")
        sys.exit(1)
        
    processed = 0
    for lat, lon in points:
        data = process_point(lat, lon)
        if data:
            success = save_terrain_feature(conn, lat, lon, data)
            if success:
                logger.info(f"Processed ({lat:.2f}, {lon:.2f}): el={data['elevation']}m, slope={data['slope']}deg, aspect={data['aspect']}deg")
        
        processed += 1
        if processed % 10 == 0:
            logger.info(f"Progress: {processed}/{len(points)}")
            
        time.sleep(0.3) # Rate limit
        
if __name__ == '__main__':
    main()
