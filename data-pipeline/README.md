# Landslide Risk Monitoring System - Data Pipeline

This repository contains the data ingestion pipeline scripts for the Landslide Risk Monitoring System.

## Setup

1. Create a virtual environment and activate it.
2. Install dependencies:
   ```bash
   pip install -r data-pipeline/requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in your database credentials and optional NASA Earthdata credentials.

## Data Sources

### NASA Global Landslide Catalog (GLC)
Free, no authentication required.
1. Go to: https://data.nasa.gov/Earth-Science/Global-Landslide-Catalog-Export/dd9e-wu2v
2. Click 'Export' > 'CSV'
3. Save to: `data/nasa_global_landslide_catalog.csv`
4. Run: 
   ```bash
   python scripts/import_isro_landslides.py --file data/nasa_global_landslide_catalog.csv --format nasa_glc
   ```

### ISRO NRSC Landslide Atlas
1. Visit: https://bhuvan.nrsc.gov.in
2. Navigate to: Disaster Management > Landslide Atlas
3. Download the shapefile
4. Save to your data directory
5. Run:
   ```bash
   python scripts/import_isro_landslides.py --file data/isro_landslides.shp --format shapefile
   ```

### GSI Landslides
Geological Survey of India landslides
1. Source data from https://www.gsi.gov.in
2. Run:
   ```bash
   python scripts/import_gsi_landslides.py --file data/gsi_landslides.csv --format csv
   ```

### Rainfall (NASA POWER)
Free, no authentication required. Fetches daily precipitation data.
- Run for a single point:
  ```bash
  python scripts/ingest_rainfall.py --lat 27.5 --lon 88.5
  ```
- Run for NER grid:
  ```bash
  python scripts/ingest_rainfall.py --grid-ner
  ```

### Elevation & Terrain (Open-Elevation)
Free, no authentication required.
- Run for a single point:
  ```bash
  python scripts/ingest_dem.py --lat 27.5 --lon 88.5
  ```
- Run for NER grid:
  ```bash
  python scripts/ingest_dem.py --grid-ner
  ```

### Soil Moisture (NASA SMAP)
Requires NASA Earthdata authentication.
1. Register FREE at: https://urs.earthdata.nasa.gov/
2. Set in `.env`:
   ```
   NASA_EARTHDATA_USERNAME=your_username
   NASA_EARTHDATA_PASSWORD=your_password
   ```
3. Create `~/.netrc` file:
   ```
   machine urs.earthdata.nasa.gov
   login your_username
   password your_password
   ```
4. Run:
   ```bash
   python scripts/ingest_soil_moisture.py
   ```

## Verifying Data
Run the verification script to see database stats:
```bash
python scripts/verify_imports.py
```
