import argparse
import sys
import os
import requests
import time
import datetime
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data_pipeline.utils.db_utils import get_connection, save_rainfall_observation
from data_pipeline.utils.geo_utils import NER_BOUNDS
from data_pipeline.utils.logging_utils import setup_logger

logger = setup_logger('ingest_rainfall')

def get_rainfall_for_point(lat, lon):
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=8)
    
    start_str = start_date.strftime('%Y%m%d')
    end_str = end_date.strftime('%Y%m%d')
    
    url = f"https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        'parameters': 'PRECTOTCORR',
        'community': 'RE',
        'longitude': lon,
        'latitude': lat,
        'start': start_str,
        'end': end_str,
        'format': 'JSON'
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        precip_data = data.get('properties', {}).get('parameter', {}).get('PRECTOTCORR', {})
        
        # NASA POWER uses -999.0 for missing data
        dates = sorted(precip_data.keys())
        values = []
        for d in dates:
            v = precip_data[d]
            if v == -999.0:
                values.append(None)
            else:
                values.append(v)
                
        # We need last day, 3 days, 7 days
        # The latest available date might be yesterday
        valid_values = [v for v in values if v is not None]
        
        if not valid_values:
            return None
            
        # Let's say we just use the last available values
        latest_vals = valid_values[-7:] if len(valid_values) >= 7 else valid_values
        
        rainfall_24h = latest_vals[-1] if latest_vals else None
        rainfall_3d = sum(latest_vals[-3:]) if len(latest_vals) >= 3 else sum(latest_vals)
        rainfall_7d = sum(latest_vals)
        
        # Find latest valid date
        latest_date_str = None
        for i in range(len(values)-1, -1, -1):
            if values[i] is not None:
                latest_date_str = dates[i]
                break
                
        if not latest_date_str:
            return None
            
        latest_date = datetime.datetime.strptime(latest_date_str, '%Y%m%d').date()
        
        return {
            'date': latest_date,
            'rainfall_24h': rainfall_24h,
            'rainfall_3d': rainfall_3d,
            'rainfall_7d': rainfall_7d
        }
    except Exception as e:
        logger.error(f"Error fetching data for ({lat}, {lon}): {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Ingest rainfall data from NASA POWER")
    parser.add_argument('--lat', type=float, help="Latitude")
    parser.add_argument('--lon', type=float, help="Longitude")
    parser.add_argument('--grid-ner', action='store_true', help="Fetch for NER grid (0.5 degree spacing)")
    
    args = parser.parse_args()
    
    if not (args.grid_ner or (args.lat is not None and args.lon is not None)):
        parser.error("Must provide either --lat/--lon or --grid-ner")
        
    points = []
    if args.grid_ner:
        lats = np.arange(NER_BOUNDS['min_lat'], NER_BOUNDS['max_lat'] + 0.5, 0.5)
        lons = np.arange(NER_BOUNDS['min_lon'], NER_BOUNDS['max_lon'] + 0.5, 0.5)
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
        
    for lat, lon in points:
        data = get_rainfall_for_point(lat, lon)
        if data:
            success = save_rainfall_observation(conn, lat, lon, data)
            if success:
                print(f"({lat:.2f}, {lon:.2f}) 24h={data['rainfall_24h']}mm 3d={data['rainfall_3d']}mm 7d={data['rainfall_7d']}mm")
        
        time.sleep(0.5) # Rate limit
        
if __name__ == '__main__':
    main()
