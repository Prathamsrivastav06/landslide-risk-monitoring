# Landslide System Database

This directory contains the database schema, seed data, and initialization scripts for the Landslide Risk Monitoring System.

## Database Stack
- PostgreSQL 15
- PostGIS 3.4 (Geospatial Extension)

## Getting Started

1.  **Start the Database**
    Run the following command from the project root (`d:\Landslide project\`) to start the PostgreSQL container:
    ```bash
    docker-compose up -d postgres
    ```

    The initialization scripts (`001_schema.sql`, `002_seed_data_sources.sql`, etc.) will automatically run the *first time* the database is created. If you need to re-initialize, delete the `postgres_data` volume and restart the container.

2.  **Connecting via PSQL**
    You can connect to the running database instance using:
    ```bash
    docker exec -it landslide_postgres psql -U landslide_user -d landslide_db
    ```

## Schema Overview

- **`users`**: System users including ADMIN, AUTHORITY, FIELD_OFFICER, and CITIZEN roles.
- **`landslide_events`**: Historical landslide occurrences. Spatial references are auto-generated from lat/lon.
- **`terrain_features`**: Static DEM/SRTM features such as elevation, slope, and aspect.
- **`rainfall_observations` & `soil_moisture_observations`**: Dynamic environmental metrics aggregated from satellite sources.
- **`field_reports`**: On-the-ground user-submitted issue reports.
- **`risk_predictions`**: Machine learning model outputs assigning risk probabilities to grid points.
- **`alerts`**: Derived actionable alerts triggered by predictions or high-severity field reports.
- **`data_sources`**: Registry of external APIs and satellite data feeds used in the system.

## Spatial Indexes

PostGIS spatial indexes (`GIST(geom)`) are actively applied to all tables with geometry data (`landslide_events`, `terrain_features`, `rainfall_observations`, `soil_moisture_observations`, `field_reports`, `alerts`, `risk_predictions`). These indexes vastly improve performance for queries such as:
- Searching for risk predictions within a specific bounding box or district.
- Correlating a field report with nearby historical landslide events.

## ISRO/NRSC Dataset Import

The system supports the massive Bhuvan historical landslide dataset.
1. Download the data from the [ISRO Bhuvan Portal](https://bhuvan.nrsc.gov.in).
2. Format the CSV file to match the `landslide_events` table structure.
3. Import the data using standard `COPY` commands or via the application's data ingestion pipeline. Spatial geoms will automatically generate via the `trg_landslide_events_geom` trigger.

## Default Admin Credentials

A default system administrator is seeded automatically.
- **Email**: `admin@landslide-sys.gov.in`
- **Password**: `Admin@1234`
