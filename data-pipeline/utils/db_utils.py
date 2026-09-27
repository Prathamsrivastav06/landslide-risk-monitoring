import psycopg2
from psycopg2.extras import Json
import psycopg2.extras
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

def get_connection():
    try:
        conn = psycopg2.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            dbname=config.DB_NAME,
            user=config.DB_USER,
            password=config.DB_PASSWORD
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def insert_landslide_event(conn, record, source):
    # Check for duplicates
    # Use ST_DWithin 1km + same date + same source
    try:
        cur = conn.cursor()
        
        # Check if table exists, if not just return error or handle it. Assuming schema exists.
        geom = f"ST_SetSRID(ST_MakePoint({record['longitude']}, {record['latitude']}), 4326)"
        
        # Duplicate check query
        dup_query = f\"\"\"
            SELECT id FROM landslide_events 
            WHERE source = %s 
            AND event_date = %s
            AND ST_DWithin(geom::geography, {geom}::geography, 1000)
            LIMIT 1
        \"\"\"
        
        cur.execute(dup_query, (source, record.get('event_date')))
        res = cur.fetchone()
        
        if res:
            return 'duplicate'
        
        insert_query = f\"\"\"
            INSERT INTO landslide_events (
                latitude, longitude, geom, event_date, year, state, district,
                landslide_type, trigger_type, casualties, damage_description,
                external_id, source, metadata
            ) VALUES (
                %s, %s, {geom}, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s
            )
        \"\"\"
        cur.execute(insert_query, (
            record['latitude'], record['longitude'], record.get('event_date'), record.get('year'),
            record.get('state'), record.get('district'), record.get('landslide_type'),
            record.get('trigger_type'), record.get('casualties'), record.get('damage_description'),
            record.get('external_id'), source, Json(record.get('metadata', {}))
        ))
        conn.commit()
        return 'inserted'
    except Exception as e:
        conn.rollback()
        return f'error: {str(e)}'
    finally:
        if cur:
            cur.close()

def batch_insert_landslides(conn, records, source):
    results = {'inserted': 0, 'duplicate': 0, 'error': 0}
    for rec in records:
        status = insert_landslide_event(conn, rec, source)
        if status == 'inserted':
            results['inserted'] += 1
        elif status == 'duplicate':
            results['duplicate'] += 1
        else:
            results['error'] += 1
            print(status)
    return results

def save_rainfall_observation(conn, lat, lon, data):
    try:
        cur = conn.cursor()
        geom = f"ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)"
        
        insert_query = f\"\"\"
            INSERT INTO rainfall_observations (
                latitude, longitude, geom, date, rainfall_24h, rainfall_3d, rainfall_7d
            ) VALUES (
                %s, %s, {geom}, %s, %s, %s, %s
            ) ON CONFLICT (latitude, longitude, date) DO UPDATE SET
                rainfall_24h = EXCLUDED.rainfall_24h,
                rainfall_3d = EXCLUDED.rainfall_3d,
                rainfall_7d = EXCLUDED.rainfall_7d
        \"\"\"
        cur.execute(insert_query, (
            lat, lon, data.get('date'), data.get('rainfall_24h'), data.get('rainfall_3d'), data.get('rainfall_7d')
        ))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error saving rainfall: {e}")
        return False
    finally:
        if cur:
            cur.close()

def save_terrain_feature(conn, lat, lon, data):
    try:
        cur = conn.cursor()
        geom = f"ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)"
        
        insert_query = f\"\"\"
            INSERT INTO terrain_features (
                latitude, longitude, geom, elevation, slope, aspect
            ) VALUES (
                %s, %s, {geom}, %s, %s, %s
            ) ON CONFLICT (latitude, longitude) DO UPDATE SET
                elevation = EXCLUDED.elevation,
                slope = EXCLUDED.slope,
                aspect = EXCLUDED.aspect
        \"\"\"
        cur.execute(insert_query, (
            lat, lon, data.get('elevation'), data.get('slope'), data.get('aspect')
        ))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error saving terrain: {e}")
        return False
    finally:
        if cur:
            cur.close()

def get_db_stats(conn):
    stats = {}
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM landslide_events")
        stats['landslide_events_total'] = cur.fetchone()[0]
        
        cur.execute("SELECT source, COUNT(*) FROM landslide_events GROUP BY source")
        stats['landslide_events_by_source'] = dict(cur.fetchall())
        
        cur.execute("SELECT state, COUNT(*) FROM landslide_events GROUP BY state")
        stats['landslide_events_by_state'] = dict(cur.fetchall())
        
        cur.execute("SELECT MIN(event_date), MAX(event_date) FROM landslide_events")
        dates = cur.fetchone()
        stats['landslide_events_min_date'] = dates[0]
        stats['landslide_events_max_date'] = dates[1]
        
        cur.execute("SELECT COUNT(*), AVG(elevation), AVG(slope) FROM terrain_features")
        terrain = cur.fetchone()
        stats['terrain_features_total'] = terrain[0]
        stats['terrain_features_avg_elevation'] = terrain[1]
        stats['terrain_features_avg_slope'] = terrain[2]
        
        cur.execute("SELECT COUNT(*), MAX(date) FROM rainfall_observations")
        rain = cur.fetchone()
        stats['rainfall_observations_total'] = rain[0]
        stats['rainfall_observations_latest'] = rain[1]
        
        return stats
    except Exception as e:
        print(f"Error getting db stats: {e}")
        return stats
    finally:
        if cur:
            cur.close()
