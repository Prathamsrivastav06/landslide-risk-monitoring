-- Extensions (no postgis needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'CITIZEN',
  phone VARCHAR(20),
  organization VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landslide events table (historical inventory)
CREATE TABLE IF NOT EXISTS landslide_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255),
  source VARCHAR(50) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  event_date DATE,
  year INTEGER,
  state VARCHAR(100),
  district VARCHAR(100),
  landslide_type VARCHAR(100),
  inventory_type VARCHAR(100),
  trigger_type VARCHAR(100),
  area_sqm DECIMAL(15,2),
  damage_description TEXT,
  casualties INTEGER,
  source_metadata JSONB,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landslide_lat_lon ON landslide_events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_landslide_state ON landslide_events(state);
CREATE INDEX IF NOT EXISTS idx_landslide_year ON landslide_events(year);
CREATE INDEX IF NOT EXISTS idx_landslide_source ON landslide_events(source);

-- Terrain features table
CREATE TABLE IF NOT EXISTS terrain_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  elevation_m DECIMAL(10,2),
  slope_degree DECIMAL(8,4),
  aspect_degree DECIMAL(8,4),
  source VARCHAR(100) DEFAULT 'SRTM',
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(latitude, longitude)
);

CREATE INDEX IF NOT EXISTS idx_terrain_lat_lon ON terrain_features(latitude, longitude);

-- Rainfall observations
CREATE TABLE IF NOT EXISTS rainfall_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  observation_date DATE NOT NULL,
  rainfall_24h_mm DECIMAL(10,3),
  rainfall_3d_mm DECIMAL(10,3),
  rainfall_7d_mm DECIMAL(10,3),
  source VARCHAR(100) DEFAULT 'NASA_POWER',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Soil moisture observations
CREATE TABLE IF NOT EXISTS soil_moisture_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  observation_date DATE NOT NULL,
  soil_moisture_m3m3 DECIMAL(10,6),
  source VARCHAR(100) DEFAULT 'NASA_SMAP',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Field reports
CREATE TABLE IF NOT EXISTS field_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offline_id VARCHAR(255),
  submitted_by UUID REFERENCES users(id),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  issue_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'MODERATE',
  description TEXT,
  photo_url TEXT,
  state VARCHAR(100),
  district VARCHAR(100),
  verification_status VARCHAR(30) DEFAULT 'PENDING',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk predictions
CREATE TABLE IF NOT EXISTS risk_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  risk_probability DECIMAL(6,4),
  risk_class VARCHAR(20),
  model_version VARCHAR(100),
  shap_values JSONB,
  feature_snapshot JSONB,
  missing_features TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID REFERENCES risk_predictions(id),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  state VARCHAR(100),
  district VARCHAR(100),
  risk_probability DECIMAL(6,4),
  risk_class VARCHAR(20),
  status VARCHAR(30) DEFAULT 'PREDICTED',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  top_factors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- Data sources registry
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  source_type VARCHAR(50),
  base_url TEXT,
  requires_auth BOOLEAN DEFAULT false,
  sync_status VARCHAR(30) DEFAULT 'PENDING',
  last_sync TIMESTAMPTZ,
  record_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model versions
CREATE TABLE IF NOT EXISTS model_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_name VARCHAR(100) UNIQUE NOT NULL,
  algorithm VARCHAR(100),
  training_samples INTEGER,
  precision_score DECIMAL(6,4),
  recall_score DECIMAL(6,4),
  f1_score DECIMAL(6,4),
  roc_auc DECIMAL(6,4),
  features_used TEXT[],
  is_active BOOLEAN DEFAULT false,
  trained_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Sync queue for offline reports
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offline_id VARCHAR(255) UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);
