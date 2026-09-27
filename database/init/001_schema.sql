-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'CITIZEN', -- ADMIN, AUTHORITY, FIELD_OFFICER, CITIZEN
  phone VARCHAR(20),
  organization VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- landslide_events table (historical inventory from ISRO/GSI)
CREATE TABLE landslide_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255),
  source VARCHAR(50) NOT NULL, -- 'ISRO_NRSC', 'GSI', 'FIELD_VERIFIED'
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  geom GEOMETRY(Point, 4326),
  event_date DATE,
  year INTEGER,
  state VARCHAR(100),
  district VARCHAR(100),
  landslide_type VARCHAR(100), -- debris flow, rockfall, slump, etc.
  inventory_type VARCHAR(100), -- historical, recent, active
  trigger_type VARCHAR(100), -- rainfall, earthquake, anthropogenic
  area_sqm DECIMAL(15,2),
  damage_description TEXT,
  casualties INTEGER,
  source_metadata JSONB,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- terrain_features table (from DEM/SRTM)
CREATE TABLE terrain_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  geom GEOMETRY(Point, 4326),
  elevation_m DECIMAL(10,2),
  slope_degree DECIMAL(8,4),
  aspect_degree DECIMAL(8,4),
  curvature DECIMAL(12,6),
  land_cover VARCHAR(100),
  land_cover_code INTEGER,
  vegetation_index DECIMAL(8,6),
  dem_source VARCHAR(100) DEFAULT 'SRTM',
  dem_resolution_m INTEGER DEFAULT 30,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(latitude, longitude)
);

-- rainfall_observations table (from NASA GPM IMERG)
CREATE TABLE rainfall_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  geom GEOMETRY(Point, 4326),
  observation_time TIMESTAMPTZ NOT NULL,
  rainfall_30min_mm DECIMAL(10,4),
  rainfall_3h_mm DECIMAL(10,4),
  rainfall_24h_mm DECIMAL(10,4),
  rainfall_3d_mm DECIMAL(10,4),
  rainfall_7d_mm DECIMAL(10,4),
  source VARCHAR(100) DEFAULT 'NASA_GPM_IMERG',
  product_version VARCHAR(50),
  spatial_resolution VARCHAR(50) DEFAULT '0.1 degree',
  data_type VARCHAR(100) DEFAULT 'Satellite precipitation estimate',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- soil_moisture_observations table (from NASA SMAP)
CREATE TABLE soil_moisture_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  geom GEOMETRY(Point, 4326),
  observation_time TIMESTAMPTZ NOT NULL,
  soil_moisture_vol DECIMAL(8,6), -- volumetric (m3/m3)
  soil_moisture_surface DECIMAL(8,6),
  soil_moisture_rootzone DECIMAL(8,6),
  quality_flag INTEGER,
  source VARCHAR(100) DEFAULT 'NASA_SMAP',
  product VARCHAR(50),
  spatial_resolution VARCHAR(50) DEFAULT '36 km',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- environmental_observations (aggregated view per location/time)
CREATE TABLE environmental_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  geom GEOMETRY(Point, 4326),
  observation_time TIMESTAMPTZ NOT NULL,
  rainfall_24h_mm DECIMAL(10,4),
  rainfall_3d_mm DECIMAL(10,4),
  rainfall_7d_mm DECIMAL(10,4),
  soil_moisture DECIMAL(8,6),
  elevation_m DECIMAL(10,2),
  slope_degree DECIMAL(8,4),
  land_cover VARCHAR(100),
  historical_landslide_count INTEGER DEFAULT 0,
  historical_landslide_density DECIMAL(12,6),
  source_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- field_reports table
CREATE TABLE field_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  geom GEOMETRY(Point, 4326),
  issue_type VARCHAR(100) NOT NULL, -- crack, slope_movement, debris, road_blockage, water_seepage, other
  description TEXT,
  photo_url VARCHAR(500),
  photo_filename VARCHAR(255),
  state VARCHAR(100),
  district VARCHAR(100),
  location_name VARCHAR(255),
  severity VARCHAR(50), -- LOW, MEDIUM, HIGH, CRITICAL
  verification_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, VERIFIED, DISMISSED
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  is_synced BOOLEAN DEFAULT true,
  offline_id VARCHAR(255), -- for offline sync matching
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- risk_predictions table
CREATE TABLE risk_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  geom GEOMETRY(Point, 4326),
  prediction_time TIMESTAMPTZ DEFAULT NOW(),
  risk_probability DECIMAL(6,4) NOT NULL,
  risk_class VARCHAR(50) NOT NULL, -- LOW, MODERATE, HIGH, CRITICAL
  model_version VARCHAR(100),
  feature_snapshot JSONB,
  shap_values JSONB,
  feature_importance JSONB,
  state VARCHAR(100),
  district VARCHAR(100),
  rainfall_24h_mm DECIMAL(10,4),
  rainfall_3d_mm DECIMAL(10,4),
  rainfall_7d_mm DECIMAL(10,4),
  soil_moisture DECIMAL(8,6),
  elevation_m DECIMAL(10,2),
  slope_degree DECIMAL(8,4),
  historical_landslide_count INTEGER,
  missing_features TEXT[],
  confidence_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID REFERENCES risk_predictions(id),
  field_report_id UUID REFERENCES field_reports(id),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  geom GEOMETRY(Point, 4326),
  state VARCHAR(100),
  district VARCHAR(100),
  location_name VARCHAR(255),
  alert_type VARCHAR(50) DEFAULT 'PREDICTED', -- PREDICTED, FIELD_REPORTED
  risk_class VARCHAR(50) NOT NULL,
  risk_probability DECIMAL(6,4),
  status VARCHAR(50) DEFAULT 'PREDICTED', -- PREDICTED, UNDER_VERIFICATION, VERIFIED, DISMISSED
  top_factors JSONB,
  recommended_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  dismissed_by UUID REFERENCES users(id),
  dismissed_at TIMESTAMPTZ,
  dismissal_reason TEXT,
  notification_sent BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false
);

-- model_versions table
CREATE TABLE model_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_name VARCHAR(100) UNIQUE NOT NULL,
  algorithm VARCHAR(100) NOT NULL, -- RandomForest, XGBoost
  trained_at TIMESTAMPTZ DEFAULT NOW(),
  training_samples INTEGER,
  positive_samples INTEGER,
  negative_samples INTEGER,
  precision_score DECIMAL(6,4),
  recall_score DECIMAL(6,4),
  f1_score DECIMAL(6,4),
  roc_auc DECIMAL(6,4),
  confusion_matrix JSONB,
  feature_importance JSONB,
  features_used TEXT[],
  hyperparameters JSONB,
  validation_method VARCHAR(100),
  is_active BOOLEAN DEFAULT false,
  model_file_path VARCHAR(500),
  notes TEXT
);

-- data_sources table
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  source_type VARCHAR(100), -- rainfall, soil_moisture, dem, historical_landslides
  url VARCHAR(500),
  license_info TEXT,
  data_period VARCHAR(100),
  spatial_resolution VARCHAR(100),
  temporal_resolution VARCHAR(100),
  last_sync TIMESTAMPTZ,
  last_successful_sync TIMESTAMPTZ,
  sync_status VARCHAR(50) DEFAULT 'UNKNOWN', -- CONNECTED, DEGRADED, UNAVAILABLE, UNKNOWN
  record_count INTEGER,
  notes TEXT,
  requires_auth BOOLEAN DEFAULT false,
  auth_env_var VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sync_queue table (for offline field reports)
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offline_id VARCHAR(255) UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  entity_type VARCHAR(100) DEFAULT 'field_report',
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSING, SYNCED, FAILED
  attempt_count INTEGER DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_landslide_events_geom ON landslide_events USING GIST(geom);
CREATE INDEX idx_landslide_events_state ON landslide_events(state);
CREATE INDEX idx_landslide_events_year ON landslide_events(year);
CREATE INDEX idx_landslide_events_source ON landslide_events(source);
CREATE INDEX idx_terrain_features_geom ON terrain_features USING GIST(geom);
CREATE INDEX idx_rainfall_obs_geom ON rainfall_observations USING GIST(geom);
CREATE INDEX idx_rainfall_obs_time ON rainfall_observations(observation_time);
CREATE INDEX idx_soil_moisture_geom ON soil_moisture_observations USING GIST(geom);
CREATE INDEX idx_field_reports_geom ON field_reports USING GIST(geom);
CREATE INDEX idx_alerts_geom ON alerts USING GIST(geom);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_risk_predictions_geom ON risk_predictions USING GIST(geom);
CREATE INDEX idx_risk_predictions_time ON risk_predictions(prediction_time);

-- Trigger Function
CREATE OR REPLACE FUNCTION update_geom_from_latlon()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
CREATE TRIGGER trg_landslide_events_geom
BEFORE INSERT OR UPDATE ON landslide_events
FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();

CREATE TRIGGER trg_terrain_features_geom
BEFORE INSERT OR UPDATE ON terrain_features
FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();

CREATE TRIGGER trg_rainfall_obs_geom
BEFORE INSERT OR UPDATE ON rainfall_observations
FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();

CREATE TRIGGER trg_soil_moisture_geom
BEFORE INSERT OR UPDATE ON soil_moisture_observations
FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();

CREATE TRIGGER trg_environmental_obs_geom
BEFORE INSERT OR UPDATE ON environmental_observations
FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();

CREATE TRIGGER trg_field_reports_geom
BEFORE INSERT OR UPDATE ON field_reports
FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();

CREATE TRIGGER trg_risk_predictions_geom
BEFORE INSERT OR UPDATE ON risk_predictions
FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();

CREATE TRIGGER trg_alerts_geom
BEFORE INSERT OR UPDATE ON alerts
FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();
