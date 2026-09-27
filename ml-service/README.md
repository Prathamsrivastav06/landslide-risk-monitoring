# Landslide Risk Monitoring ML Service

This repository contains the Machine Learning microservice for the Landslide Risk Monitoring System (SIH 2026).

## Environment Setup

Requires Python 3.9+.

```bash
cd "d:\Landslide project\ml-service"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Set your database connection in `.env` (or pass via environment variables):
```env
DATABASE_URL=postgresql://landslide_user:password@localhost:5432/landslide_db
```

## Training Data Generation

The `generate_training_data.py` script pulls positive historical events and geographically constrained negative samples from the database.

```bash
python training/generate_training_data.py
```
This produces `training/training_data.csv`.

## Model Training

The training script trains a Random Forest classifier using a time-aware validation split (preventing data leakage), generates SHAP explainability matrices, and outputs the `.joblib` model and metadata.

```bash
python training/train.py
```
Outputs are saved to `models/` and `models/metadata/`.

## Running the Service

Start the FastAPI application:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## API Documentation

When the service is running, interactive API docs are available at `http://localhost:8000/docs`.

### Key Endpoints:
- `GET /health`: Health check, returns model loading status.
- `GET /model/status`: Returns current model version and details.
- `GET /model/metrics`: Returns real cross-validation metrics (precision, recall, f1, ROC-AUC) of the loaded model.
- `POST /predict`: Predict landslide risk. Requires `lat`, `lon`, and available feature data (like `rainfall_24h_mm`, `elevation_m`, `slope_degree`).

## Limitations
- Predictions are highly dependent on the quality of the input features.
- Model thresholds (Low/Moderate/High/Critical) are preliminary and should be calibrated with domain experts.
- Does not replace official government early warning systems.
