# 🏔️ How to Run — Landslide Early Warning & Command Center (SIH 2026)

This package contains the complete source code, calibrated AI prediction engines, PostgreSQL schemas, and interactive GIS frontend.

---

## ⚡ Quickest Way to Run (Windows)

Simply double-click:
```
start_project.bat
```
This will automatically launch the Backend on port 3001, the Frontend on port 5173, and open your default browser to `http://localhost:5173`.

---

## 🛠️ Manual Step-by-Step Setup

### 1. Prerequisites
- **Node.js**: v18.0 or newer ([nodejs.org](https://nodejs.org/))
- **PostgreSQL**: Local PostgreSQL 14+ or Docker (database: `landslide_db`, user: `postgres`, password: `postgres`)

### 2. Install Dependencies & Start Services

#### Backend API (Port 3001):
```bash
cd backend
npm install
npm start
```
*Backend will be running at `http://localhost:3001`.*

#### Frontend Command Center (Port 5173):
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend will be running at `http://localhost:5173`.*

---

## 🌐 Application Pages & Features

- **`/` Command Center**: Interactive 3D/2D GIS Map (MapLibre GL), 8 NER Vulnerable Corridors, live risk halos, terrain extraction, collapsible sidebar.
- **`/predict` AI Prediction Studio**: Dual-engine Platt-calibrated ML model, 7 parameter sliders, 4 disaster simulation scenarios, TreeSHAP feature explainability, 1-click emergency alert broadcast.
- **`/architecture` SIH Judge Presentation**: End-to-end data pipeline, confusion matrix, ROC-AUC (89%), feature importance ranking, and mathematical formulations.
- **`/alerts` Emergency Warning Hub**: Real-time incident verification, priority filtering, and automated dissemination dispatch.
- **`/analytics` Historical & Spatial Analytics**: Landslide cluster analysis, temporal trends, and density heatmaps.
- **`/field` Ground-Truth Ops Portal**: Field incident submission with photo attachments and PostGIS coordinate geolocation.
- **`/data-sources` Satellite & Ingestion Health**: Live health monitoring for NASA POWER, SRTM DEM, Open-Meteo, and database status.
- **`/limitations` Transparency & Engineering Roadmap**: SIH26001 technical boundaries, cloudburst resolution disclosures, and mitigation roadmap.
