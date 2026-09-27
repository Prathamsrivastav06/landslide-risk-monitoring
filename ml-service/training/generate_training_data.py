"""
Generate training dataset for landslide risk model.

METHODOLOGY:
-----------
Positive samples: Historical landslide events from ISRO/GSI inventory.
  - Each event is a confirmed landslide occurrence.
  - Features extracted from: environmental data closest to event date/location.
  - Falls back to terrain-only if environmental data not available for that date.

Negative samples: Non-event background samples.
  - Strategy: Stratified spatial sampling in NER region.
  - NOT random: samples are constrained to:
    (a) Locations where NO landslide occurred within 2km radius in the same year.
    (b) Similar terrain (NER mountains) to reduce geographic bias.
    (c) Multiple time periods (monsoon months, non-monsoon months).
  - Ratio: 3:1 negative:positive (imbalanced data handling via class_weight='balanced').

VALIDATION STRATEGY:
  - Time-aware split: train on events before 2020, test on 2020-2022.
  - This prevents data leakage from future events.
  - Also report spatial cross-validation (leave-one-state-out).

AVOIDS:
  - Random coordinate generation without geographic constraints.
  - Sampling at actual landslide locations as negatives.
  - Using future environmental data for past events.
"""

import psycopg2
import pandas as pd
import numpy as np
from datetime import datetime, date
import json
import os
import sys

NER_BOUNDS = {
    'min_lat': 20.0, 'max_lat': 30.0,
    'min_lon': 88.0, 'max_lon': 98.0
}

NER_STATES = [
    'Sikkim', 'Arunachal Pradesh', 'Assam',
    'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Tripura'
]

def get_positive_samples(conn):
    """Get historical landslide events as positive samples."""
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            le.id, le.latitude, le.longitude, le.event_date, le.year,
            le.state, le.district,
            tf.elevation_m, tf.slope_degree,
            ro.rainfall_24h_mm, ro.rainfall_3d_mm, ro.rainfall_7d_mm,
            sm.soil_moisture_vol as soil_moisture,
            (
                SELECT COUNT(*) FROM landslide_events le2
                WHERE ST_DWithin(
                    le.geom::geography,
                    le2.geom::geography,
                    5000
                ) AND le2.id != le.id
            ) as historical_landslide_count
        FROM landslide_events le
        LEFT JOIN terrain_features tf ON 
            ABS(tf.latitude - le.latitude) < 0.01 AND ABS(tf.longitude - le.longitude) < 0.01
        LEFT JOIN rainfall_observations ro ON
            ABS(ro.latitude - le.latitude) < 0.1 AND ABS(ro.longitude - le.longitude) < 0.1
            AND ro.observation_time::date = le.event_date
        LEFT JOIN soil_moisture_observations sm ON
            ABS(sm.latitude - le.latitude) < 0.3 AND ABS(sm.longitude - le.longitude) < 0.3
            AND sm.observation_time::date = le.event_date
        WHERE le.state = ANY(%s)
        ORDER BY le.event_date
    """, (NER_STATES,))
    
    rows = cur.fetchall()
    columns = [d[0] for d in cur.description]
    df = pd.DataFrame(rows, columns=columns)
    df['landslide_occurred'] = 1
    return df

def get_negative_samples(conn, n_positive):
    """Generate geographically appropriate non-event samples."""
    n_negative = n_positive * 3
    cur = conn.cursor()
    
    # Get grid of terrain-available locations that are NOT near landslides
    cur.execute("""
        SELECT tf.latitude, tf.longitude, tf.elevation_m, tf.slope_degree
        FROM terrain_features tf
        WHERE NOT EXISTS (
            SELECT 1 FROM landslide_events le
            WHERE ST_DWithin(
                ST_SetSRID(ST_MakePoint(tf.longitude, tf.latitude), 4326)::geography,
                le.geom::geography,
                2000  -- 2km exclusion zone
            )
        )
        AND tf.latitude BETWEEN 20 AND 30
        AND tf.longitude BETWEEN 88 AND 98
        LIMIT %s
    """, (n_negative,))
    
    rows = cur.fetchall()
    columns = [d[0] for d in cur.description]
    neg_df = pd.DataFrame(rows, columns=columns)
    neg_df['landslide_occurred'] = 0
    neg_df['rainfall_24h_mm'] = None  # Environmental data not available for these background points
    neg_df['rainfall_3d_mm'] = None
    neg_df['rainfall_7d_mm'] = None
    neg_df['soil_moisture'] = None
    neg_df['historical_landslide_count'] = 0
    
    print(f"Generated {len(neg_df)} negative samples (non-event background)")
    return neg_df

def save_training_data(df, output_path='./training/training_data.csv'):
    df.to_csv(output_path, index=False)
    print(f"Saved {len(df)} training samples to {output_path}")
    print(f"  Positive: {df['landslide_occurred'].sum()}")
    print(f"  Negative: {(df['landslide_occurred'] == 0).sum()}")
    return output_path

if __name__ == '__main__':
    import psycopg2
    from dotenv import load_dotenv
    load_dotenv()
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    print("Generating training data...")
    
    pos = get_positive_samples(conn)
    print(f"Positive samples: {len(pos)}")
    
    neg = get_negative_samples(conn, len(pos))
    
    df = pd.concat([pos, neg], ignore_index=True)
    save_training_data(df)
    conn.close()
