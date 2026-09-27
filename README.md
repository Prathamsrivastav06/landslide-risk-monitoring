# 🏔️ AI-Based Landslide Risk Monitoring & Early Warning System
### SIH 2026 | Problem Statement SIH26001 | North Eastern Region, India

A full-stack geospatial intelligence command center for AI-powered landslide risk monitoring across India's North Eastern Region. Built as SIH 2026 prototype.

---

## 🟢 Verified Running Services

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** (React + MapLibre GL) | http://localhost:5173 | Run: `cd frontend && npm run dev` |
| **Backend API** (Node.js Express) | http://localhost:3001 | Run: `cd backend && npm run dev` |
| **ML Service** (Python FastAPI) | http://localhost:8000 | Run: `cd ml-service && uvicorn app:app --port 8000 --reload` |
| **Database** (PostgreSQL/PostGIS) | localhost:5432 | Run: `docker-compose up -d postgres` |

### Verified API Calls (No Auth Required)
- `GET http://localhost:3001/api/terrain?lat=27.33&lon=88.62` → **elevation: 1586m, slope: 28.48°** (real SRTM data)
- `GET http://localhost:3001/api/data-sources/health` → NASA POWER: CONNECTED, SRTM: CONNECTED, ML: ONLINE
- `GET http://localhost:8000/health` → `{"status":"online","model_loaded":false}`

---

## 🚀 Quick Start (Full Stack)

### 1. Prerequisites
- Node.js 18+
- Python 3.10+
- Docker Desktop

### 2. Clone & Install

```powershell
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ..
cd frontend
npm install

# ML service dependencies
cd ..
cd ml-service
pip install fastapi uvicorn scikit-learn shap pandas numpy joblib python-dotenv pydantic pydantic-settings httpx pytest

# Data pipeline (optional — for data ingestion scripts)
cd ..
cd data-pipeline
pip install -r requirements.txt
```

### 3. Configure Environment

```powershell
copy .env.example backend\.env
```

Edit `backend/.env` with your values:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=landslide_db
DB_USER=landslide_user
DB_PASSWORD=landslide_password
ML_SERVICE_URL=http://localhost:8000
JWT_SECRET=your_random_secret_here_change_in_production
TERRAIN_CACHE_TTL=86400
RAINFALL_CACHE_TTL=1800
ALERT_TRIGGER_THRESHOLD=0.50
```

### 4. Start Database

```powershell
docker-compose up -d postgres
# Wait 30 seconds for initialization
docker-compose ps
```

The database auto-executes:
- `001_schema.sql` — Full PostGIS schema
- `002_seed_data_sources.sql` — Data source registry
- `003_seed_admin.sql` — Default admin users
- `004_ner_sample_landslides.sql` — 50 sample NER landslide events

### 5. Start All Services

Open 3 separate terminals:

**Terminal 1 — ML Service:**
```powershell
cd ml-service
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Backend:**
```powershell
cd backend
$env:PORT="3001"
npm run dev
```

**Terminal 3 — Frontend:**
```powershell
cd frontend
npm run dev
```

**Open:** http://localhost:5173

---

## 📥 Data Acquisition

### Step 1: NASA Global Landslide Catalog (FREE — No Auth)

1. Go to: https://data.nasa.gov/Earth-Science/Global-Landslide-Catalog-Export/dd9e-wu2v
2. Click **Export → CSV**
3. Save as: `data/nasa_global_landslide_catalog.csv`
4. Run:
```bash
python scripts/import_isro_landslides.py --file data/nasa_global_landslide_catalog.csv --format nasa_glc
```

### Step 2: ISRO NRSC Landslide Atlas (FREE)

1. Visit: https://bhuvan.nrsc.gov.in
2. Navigate: Disaster Management → Landslide Atlas
3. Download shapefile → `data/isro_landslides.shp`
4. Run:
```bash
python scripts/import_isro_landslides.py --file data/isro_landslides.shp --format shapefile
```

### Step 3: Ingest Environmental Data

```bash
# Rainfall (NASA POWER — free, no auth)
python scripts/ingest_rainfall.py --grid-ner

# Terrain/DEM (SRTM via open-elevation — free, no auth)
python scripts/ingest_dem.py --grid-ner

# Verify everything
python scripts/verify_imports.py
```

### Step 4 (Optional): NASA SMAP Soil Moisture

1. Register FREE at: https://urs.earthdata.nasa.gov/
2. Add to `backend/.env`:
```env
NASA_EARTHDATA_USERNAME=your_username
NASA_EARTHDATA_PASSWORD=your_password
```
3. Create `~/.netrc`:
```
machine urs.earthdata.nasa.gov
login your_username
password your_password
```

Without SMAP: system works perfectly — shows "Soil moisture: Data currently unavailable" in UI.

---

## 🤖 Training the AI Model

After importing landslide + terrain data:

```bash
cd ml-service

# Generate training dataset from DB
python training/generate_training_data.py

# Train Random Forest + SHAP explainability
python training/train.py
```

Model saved to: `ml-service/models/landslide_rf_model.joblib`

**Features used:** rainfall_24h, rainfall_3d, rainfall_7d, soil_moisture, elevation_m, slope_degree, historical_density, historical_count

**Validation:** Time-aware split — train on pre-2020 data, test on 2020+ (avoids data leakage)

**Expected metrics:**
- Precision: ~0.65–0.80
- Recall: ~0.70–0.85
- F1: ~0.70–0.82
- ROC-AUC: ~0.82–0.92

---

## 👥 Demo Users

All accounts use password: **Admin@1234**

| Email | Role |
|-------|------|
| admin@landslide-sys.gov.in | ADMIN |
| authority@landslide-sys.gov.in | AUTHORITY |
| officer@landslide-sys.gov.in | FIELD_OFFICER |

---

## 📡 API Reference

### Public Endpoints (No Auth)
```
GET /api/terrain?lat=&lon=              # Elevation + slope (SRTM)
GET /api/rainfall?lat=&lon=             # Precipitation (NASA POWER)
GET /api/soil-moisture?lat=&lon=        # Soil moisture (NASA SMAP)
GET /api/landslides/nearby?lat=&lon=&radius= # Historical events in radius
GET /api/landslides?bbox=minLon,minLat,maxLon,maxLat # Map viewport query
GET /api/landslides/historical-analysis?state= # Analytics
GET /api/data-sources/health            # Live API health check
GET /api/risk?lat=&lon=                 # Full risk assessment
POST /api/auth/login                    # Login
```

### Protected Endpoints (Bearer JWT)
```
GET  /api/alerts                        # Active alerts (AUTHORITY+)
POST /api/alerts/:id/verify             # Verify alert (AUTHORITY+)
POST /api/field-reports                 # Submit field report
GET  /api/field-reports                 # List reports
POST /api/field-reports/:id/verify      # Verify report
GET  /api/model/status                  # ML model status
GET  /api/model/metrics                 # Training metrics
```

---

## 🗺️ NER Demo Locations

These 5 coordinates are pre-loaded in the frontend for quick demo:

| Location | Coordinates | Notes |
|----------|-------------|-------|
| East Sikkim | 27.33°N, 88.62°E | High landslide density, Teesta valley |
| West Kameng, Arunachal | 27.05°N, 92.40°E | NH-15 corridor |
| Tamenglong, Manipur | 24.99°N, 93.50°E | High rainfall zone |
| East Khasi Hills, Meghalaya | 25.50°N, 91.88°E | Cherrapunji area |
| Lunglei, Mizoram | 22.89°N, 92.73°E | Southern Mizoram |

---

## ⚠️ Honest System Limitations

As displayed in the **Limitations** page of the application:

1. **NASA POWER data lag**: MERRA-2 reanalysis has a multi-month processing lag. This is NOT live sensor data.
2. **SRTM resolution**: 30m horizontal resolution, captured Feb 2000. Does not reflect land use changes.
3. **No real-time sensors**: This system uses satellite reanalysis, not ground IoT sensors.
4. **SMAP 36km resolution**: Soil moisture is a grid average, not a point measurement.
5. **Historical inventory gaps**: ISRO/GSI inventories may not capture all historical events.
6. **Prototype thresholds**: Risk classifications are not officially calibrated government thresholds.

---

## 📁 Project Structure

```
d:\Landslide project\
├── frontend/               # React 18 + Vite + Tailwind + MapLibre GL
│   └── src/
│       ├── pages/          # Dashboard, Analytics, FieldReport, Alerts, DataSources, Limitations, Login
│       ├── components/     # Map, panels, forms, common UI
│       ├── services/       # API client, offline queue (IndexedDB)
│       └── contexts/       # Auth, Map
├── backend/                # Node.js + Express
│   └── src/
│       ├── routes/         # All API routes
│       ├── controllers/    # Request handlers
│       ├── services/       # NASA APIs, ML service proxy, alerts
│       ├── models/         # PostGIS database models
│       └── middleware/     # Auth, roles, rate limiting
├── ml-service/             # Python + FastAPI + scikit-learn
│   ├── features/           # Feature engineering + validation
│   ├── inference/          # Predictor with SHAP
│   ├── training/           # Training scripts + methodology docs
│   └── evaluation/         # Metrics utilities
├── database/init/          # SQL schema + seeds (auto-executed by Docker)
├── scripts/                # Data ingestion CLI scripts
├── data-pipeline/          # Pipeline utilities + config
├── docker-compose.yml      # PostgreSQL 15 + PostGIS 3.4
├── .env.example            # All environment variables
└── README.md               # This file
```

---

## 🎯 SIH 2026 Demo Walkthrough

1. **Open** http://localhost:5173 → Command Center loads
2. **Click** "East Sikkim" in the location bar → map zooms to 27.33°N, 88.62°E
3. **See** real SRTM data: elevation 1586m, slope 28.48°
4. **See** honest data availability: Rainfall shows MERRA-2 lag notice
5. **See** historical events count from DB (seed data visible)
6. **Navigate** to Analytics → bar charts from real DB queries
7. **Navigate** to Field Report → demo offline mode toggle
8. **Navigate** to Data Sources → live connectivity status panel
9. **Navigate** to Limitations → full transparency disclosure
10. **Navigate** to Alerts → alert lifecycle demonstration
11. **Login** as authority@landslide-sys.gov.in / Admin@1234
12. **Show** role-based access (verify/dismiss alerts)

---

*SIH 2026 | Government of India | Smart India Hackathon*
*Problem Statement: AI-Based Early Warning and Landslide Risk Monitoring System in NER*
