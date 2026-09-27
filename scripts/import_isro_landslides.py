import argparse
import sys
import os
import pandas as pd
import geopandas as gpd

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data_pipeline.utils.db_utils import get_connection, insert_landslide_event
from data_pipeline.utils.geo_utils import is_in_ner
from data_pipeline.utils.validators import validate_coordinate, validate_date
from data_pipeline.utils.logging_utils import setup_logger

logger = setup_logger('import_isro_landslides')

def print_help():
    print(\"\"\"
NASA Global Landslide Catalog (free, no authentication required):
  1. Go to: https://data.nasa.gov/Earth-Science/Global-Landslide-Catalog-Export/dd9e-wu2v
  2. Click 'Export' > 'CSV'
  3. Save to: data/nasa_global_landslide_catalog.csv
  4. Run: python scripts/import_isro_landslides.py --file data/nasa_global_landslide_catalog.csv --format nasa_glc

ISRO NRSC Landslide Atlas:
  1. Visit: https://bhuvan.nrsc.gov.in
  2. Navigate to: Disaster Management > Landslide Atlas
  3. Download the shapefile
  4. Run: python scripts/import_isro_landslides.py --file data/isro_landslides.shp --format shapefile
\"\"\")

def parse_nasa_glc(file_path, ner_only):
    logger.info(f"Reading NASA GLC from {file_path}")
    df = pd.read_csv(file_path)
    total_records = len(df)
    logger.info(f"Total records in file: {total_records}")
    
    # Filter to India
    if 'country_name' in df.columns:
        df = df[df['country_name'] == 'India']
    
    records = []
    for _, row in df.iterrows():
        lat, lon = row.get('latitude'), row.get('longitude')
        valid_coords, _ = validate_coordinate(lat, lon)
        if not valid_coords:
            continue
            
        if ner_only and not is_in_ner(lat, lon):
            continue
            
        date_obj, _ = validate_date(row.get('event_date'))
        
        record = {
            'latitude': lat,
            'longitude': lon,
            'event_date': date_obj,
            'year': date_obj.year if date_obj else None,
            'state': row.get('admin_division_name'),
            'district': row.get('location_description'),
            'landslide_type': row.get('landslide_category'),
            'trigger_type': row.get('landslide_trigger'),
            'casualties': row.get('fatalities') if pd.notna(row.get('fatalities')) else None,
            'damage_description': row.get('event_description'),
            'external_id': row.get('original_event_id') if pd.notna(row.get('original_event_id')) else str(row.get('event_id', '')),
            'metadata': row.to_dict()
        }
        
        # clean up nan in metadata
        record['metadata'] = {k: v for k, v in record['metadata'].items() if pd.notna(v)}
        records.append(record)
        
    return records, total_records

def parse_spatial_file(file_path, format_type, ner_only):
    logger.info(f"Reading {format_type} from {file_path}")
    gdf = gpd.read_file(file_path)
    total_records = len(gdf)
    logger.info(f"Total records in file: {total_records}")
    
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)
        
    # Assume points or use centroid
    gdf['geometry'] = gdf['geometry'].centroid
    
    records = []
    for _, row in gdf.iterrows():
        geom = row['geometry']
        if not geom or geom.is_empty:
            continue
            
        lat, lon = geom.y, geom.x
        if ner_only and not is_in_ner(lat, lon):
            continue
            
        date_col = next((c for c in row.index if 'date' in c.lower()), None)
        date_str = row[date_col] if date_col else None
        date_obj, _ = validate_date(date_str)
        
        record = {
            'latitude': lat,
            'longitude': lon,
            'event_date': date_obj,
            'year': date_obj.year if date_obj else None,
            'state': row.get('state') or row.get('STATE'),
            'district': row.get('district') or row.get('DISTRICT'),
            'landslide_type': row.get('type') or row.get('TYPE'),
            'trigger_type': row.get('trigger') or row.get('TRIGGER'),
            'casualties': None,
            'damage_description': None,
            'external_id': row.get('id') or row.get('ID'),
            'metadata': {k: v for k, v in row.items() if k != 'geometry' and pd.notna(v)}
        }
        records.append(record)
        
    return records, total_records

def main():
    parser = argparse.ArgumentParser(description="Import landslide records")
    parser.add_argument('--file', type=str, required=True, help="Path to data file")
    parser.add_argument('--format', type=str, choices=['shapefile', 'geojson', 'nasa_glc', 'auto'], default='auto')
    parser.add_argument('--ner-only', action='store_true', default=True, help="Filter to NER bounds")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        logger.error(f"File not found: {args.file}")
        print_help()
        sys.exit(1)
        
    format_type = args.format
    if format_type == 'auto':
        ext = os.path.splitext(args.file)[1].lower()
        if ext == '.csv':
            format_type = 'nasa_glc'
        elif ext == '.shp':
            format_type = 'shapefile'
        elif ext in ['.geojson', '.json']:
            format_type = 'geojson'
            
    source = 'NASA_GLC' if format_type == 'nasa_glc' else 'ISRO_NRSC'
            
    try:
        if format_type == 'nasa_glc':
            records, total_records = parse_nasa_glc(args.file, args.ner_only)
        else:
            records, total_records = parse_spatial_file(args.file, format_type, args.ner_only)
    except Exception as e:
        logger.error(f"Error parsing file: {e}")
        sys.exit(1)
        
    logger.info(f"Records after NER filter: {len(records)}")
    
    conn = get_connection()
    if not conn:
        logger.error("Failed to connect to database")
        sys.exit(1)
        
    results = {'inserted': 0, 'duplicate': 0, 'error': 0}
    for rec in records:
        status = insert_landslide_event(conn, rec, source)
        if status == 'inserted':
            results['inserted'] += 1
        elif status == 'duplicate':
            results['duplicate'] += 1
        else:
            results['error'] += 1
            
    logger.info(f"Final: Imported: {results['inserted']}, Duplicates: {results['duplicate']}, Rejected: {total_records - len(records)}, Errors: {results['error']}")

if __name__ == '__main__':
    main()
