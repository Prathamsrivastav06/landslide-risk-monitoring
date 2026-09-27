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

logger = setup_logger('import_gsi_landslides')

def print_help():
    print(\"\"\"
GSI Landslides:
  1. Source data from https://www.gsi.gov.in
  2. Run: python scripts/import_gsi_landslides.py --file data/gsi_landslides.csv --format csv
\"\"\")

def parse_gsi_csv(file_path, ner_only):
    logger.info(f"Reading GSI CSV from {file_path}")
    df = pd.read_csv(file_path)
    total_records = len(df)
    logger.info(f"Total records in file: {total_records}")
    
    records = []
    for _, row in df.iterrows():
        lat_col = next((c for c in row.index if 'lat' in c.lower()), None)
        lon_col = next((c for c in row.index if 'lon' in c.lower()), None)
        
        if not lat_col or not lon_col:
            continue
            
        lat, lon = row.get(lat_col), row.get(lon_col)
        valid_coords, _ = validate_coordinate(lat, lon)
        if not valid_coords:
            continue
            
        if ner_only and not is_in_ner(lat, lon):
            continue
            
        date_col = next((c for c in row.index if 'date' in c.lower()), None)
        date_obj, _ = validate_date(row.get(date_col) if date_col else None)
        
        record = {
            'latitude': lat,
            'longitude': lon,
            'event_date': date_obj,
            'year': date_obj.year if date_obj else None,
            'state': row.get('state') or row.get('State'),
            'district': row.get('district') or row.get('District'),
            'landslide_type': row.get('type') or row.get('Type'),
            'trigger_type': row.get('trigger') or row.get('Trigger'),
            'casualties': row.get('casualties') or row.get('Fatalities'),
            'damage_description': row.get('description') or row.get('Damage'),
            'external_id': row.get('id') or row.get('ID') or str(row.name),
            'metadata': row.to_dict()
        }
        
        # clean up nan in metadata
        record['metadata'] = {k: v for k, v in record['metadata'].items() if pd.notna(v)}
        records.append(record)
        
    return records, total_records

def main():
    parser = argparse.ArgumentParser(description="Import GSI landslide records")
    parser.add_argument('--file', type=str, required=True, help="Path to data file")
    parser.add_argument('--format', type=str, choices=['csv', 'excel', 'auto'], default='auto')
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
            format_type = 'csv'
        elif ext in ['.xls', '.xlsx']:
            format_type = 'excel'
            
    try:
        if format_type == 'csv':
            records, total_records = parse_gsi_csv(args.file, args.ner_only)
        else:
            logger.error(f"Format {format_type} not implemented yet")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Error parsing file: {e}")
        sys.exit(1)
        
    logger.info(f"Records after NER filter: {len(records)}")
    
    conn = get_connection()
    if not conn:
        logger.error("Failed to connect to database")
        sys.exit(1)
        
    results = {'inserted': 0, 'duplicate': 0, 'error': 0}
    source = 'GSI'
    
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
