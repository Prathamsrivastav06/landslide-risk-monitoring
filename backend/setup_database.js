const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setup() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'landslide_db',
    user: process.env.DB_USER || 'landslide_user',
    password: process.env.DB_PASSWORD || 'your_secure_password',
  });

  console.log('Connecting to PostgreSQL database...');
  await client.connect();
  console.log('Connected successfully!');

  // 1. Extensions & Polyfills
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geometry') THEN
        CREATE TYPE geometry AS (x float8, y float8, srid int);
      END IF;
    END $$;
  `);

  await client.query(`
    CREATE OR REPLACE FUNCTION ST_MakePoint(x float8, y float8) RETURNS geometry AS $$
    BEGIN
      RETURN (x, y, 0)::geometry;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    CREATE OR REPLACE FUNCTION ST_SetSRID(geom geometry, srid int) RETURNS geometry AS $$
    BEGIN
      RETURN (geom.x, geom.y, srid)::geometry;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    CREATE OR REPLACE FUNCTION ST_X(geom geometry) RETURNS float8 AS $$
    BEGIN
      RETURN geom.x;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    CREATE OR REPLACE FUNCTION ST_Y(geom geometry) RETURNS float8 AS $$
    BEGIN
      RETURN geom.y;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `);

  console.log('Extensions and Geometry polyfills registered.');

  // 2. Schema definition
  await client.query(`
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

    CREATE TABLE IF NOT EXISTS landslide_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      external_id VARCHAR(255),
      source VARCHAR(50) NOT NULL,
      latitude DECIMAL(10,7) NOT NULL,
      longitude DECIMAL(10,7) NOT NULL,
      geom geometry,
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

    CREATE TABLE IF NOT EXISTS terrain_features (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      latitude DECIMAL(10,7) NOT NULL,
      longitude DECIMAL(10,7) NOT NULL,
      geom geometry,
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

    CREATE TABLE IF NOT EXISTS rainfall_observations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      latitude DECIMAL(10,7) NOT NULL,
      longitude DECIMAL(10,7) NOT NULL,
      geom geometry,
      observation_time TIMESTAMPTZ DEFAULT NOW(),
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

    CREATE TABLE IF NOT EXISTS soil_moisture_observations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      latitude DECIMAL(10,7) NOT NULL,
      longitude DECIMAL(10,7) NOT NULL,
      geom geometry,
      observation_time TIMESTAMPTZ DEFAULT NOW(),
      soil_moisture_vol DECIMAL(8,6),
      soil_moisture_surface DECIMAL(8,6),
      soil_moisture_rootzone DECIMAL(8,6),
      quality_flag INTEGER,
      source VARCHAR(100) DEFAULT 'NASA_SMAP',
      product VARCHAR(50),
      spatial_resolution VARCHAR(50) DEFAULT '36 km',
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS environmental_observations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      latitude DECIMAL(10,7) NOT NULL,
      longitude DECIMAL(10,7) NOT NULL,
      geom geometry,
      observation_time TIMESTAMPTZ DEFAULT NOW(),
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

    CREATE TABLE IF NOT EXISTS risk_predictions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      latitude DECIMAL(10,7) NOT NULL,
      longitude DECIMAL(10,7) NOT NULL,
      geom geometry,
      prediction_time TIMESTAMPTZ DEFAULT NOW(),
      risk_probability DECIMAL(6,4),
      risk_class VARCHAR(50) NOT NULL,
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

    CREATE TABLE IF NOT EXISTS field_reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      reporter_id UUID REFERENCES users(id),
      user_id UUID REFERENCES users(id),
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      geom geometry,
      issue_type VARCHAR(100) NOT NULL,
      description TEXT,
      photo_url VARCHAR(500),
      photo_filename VARCHAR(255),
      state VARCHAR(100),
      district VARCHAR(100),
      location_name VARCHAR(255),
      severity VARCHAR(50) DEFAULT 'MEDIUM',
      status VARCHAR(50) DEFAULT 'PENDING',
      verification_status VARCHAR(50) DEFAULT 'PENDING',
      verified_by UUID REFERENCES users(id),
      verified_at TIMESTAMPTZ,
      verification_notes TEXT,
      is_synced BOOLEAN DEFAULT true,
      offline_id VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      prediction_id UUID REFERENCES risk_predictions(id),
      field_report_id UUID REFERENCES field_reports(id),
      latitude DECIMAL(10,7) NOT NULL,
      longitude DECIMAL(10,7) NOT NULL,
      geom geometry,
      state VARCHAR(100),
      district VARCHAR(100),
      location_name VARCHAR(255),
      alert_type VARCHAR(50) DEFAULT 'PREDICTED',
      risk_class VARCHAR(50) NOT NULL,
      risk_probability DECIMAL(6,4),
      status VARCHAR(50) DEFAULT 'PREDICTED',
      top_factors JSONB,
      recommended_action TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      verified_by UUID REFERENCES users(id),
      verified_at TIMESTAMPTZ,
      verification_notes TEXT,
      dismissed_by UUID REFERENCES users(id),
      dismissed_at TIMESTAMPTZ,
      dismissed_reason TEXT,
      dismissal_reason TEXT,
      notification_sent BOOLEAN DEFAULT false,
      email_sent BOOLEAN DEFAULT false,
      sms_sent BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS model_versions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      version_name VARCHAR(100) UNIQUE NOT NULL,
      algorithm VARCHAR(100) NOT NULL,
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

    CREATE TABLE IF NOT EXISTS data_sources (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) UNIQUE NOT NULL,
      display_name VARCHAR(255),
      source_type VARCHAR(100),
      url VARCHAR(500),
      license_info TEXT,
      data_period VARCHAR(100),
      spatial_resolution VARCHAR(100),
      temporal_resolution VARCHAR(100),
      last_sync TIMESTAMPTZ,
      last_successful_sync TIMESTAMPTZ,
      sync_status VARCHAR(50) DEFAULT 'UNKNOWN',
      record_count INTEGER,
      notes TEXT,
      requires_auth BOOLEAN DEFAULT false,
      auth_env_var VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      offline_id VARCHAR(255) UNIQUE NOT NULL,
      payload JSONB NOT NULL,
      entity_type VARCHAR(100) DEFAULT 'field_report',
      status VARCHAR(50) DEFAULT 'PENDING',
      attempt_count INTEGER DEFAULT 0,
      last_attempt TIMESTAMPTZ,
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      synced_at TIMESTAMPTZ
    );
  `);

  console.log('Tables verified and created successfully.');

  // 3. Seed data
  const seedDataSourcesSQL = fs.readFileSync(path.join(__dirname, '../database/init/002_seed_data_sources.sql'), 'utf-8');
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM data_sources LIMIT 1) THEN
        ${seedDataSourcesSQL}
      END IF;
    END $$;
  `);
  console.log('Data sources seeded.');

  const seedAdminSQL = fs.readFileSync(path.join(__dirname, '../database/init/003_seed_admin.sql'), 'utf-8');
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM users WHERE email='admin@landslide-sys.gov.in') THEN
        ${seedAdminSQL}
      END IF;
    END $$;
  `);
  console.log('Admin users seeded.');

  const seedLandslidesSQL = fs.readFileSync(path.join(__dirname, '../database/init/004_ner_sample_landslides.sql'), 'utf-8');
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM landslide_events LIMIT 1) THEN
        ${seedLandslidesSQL}
      END IF;
    END $$;
  `);
  console.log('NER sample landslides seeded.');

  // Check counts
  const uCount = await client.query('SELECT COUNT(*) FROM users');
  const lCount = await client.query('SELECT COUNT(*) FROM landslide_events');
  const dCount = await client.query('SELECT COUNT(*) FROM data_sources');
  console.log(`Database ready: ${uCount.rows[0].count} users, ${lCount.rows[0].count} landslides, ${dCount.rows[0].count} data sources.`);

  await client.end();
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
