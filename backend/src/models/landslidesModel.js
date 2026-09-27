const db = require('./db');

function haversineKm(lat, lon) {
    return `(6371.0 * 2.0 * ASIN(SQRT(
        POWER(SIN((latitude - ${lat}) * PI() / 360.0), 2) +
        COS(${lat} * PI() / 180.0) * COS(latitude * PI() / 180.0) *
        POWER(SIN((longitude - ${lon}) * PI() / 360.0), 2)
    )))`;
}

exports.findNearby = async (lat, lon, radiusKm = 10) => {
    const latDelta = radiusKm / 111.0;
    const lonDelta = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180));
    const result = await db.query(
        `SELECT id, event_date, state, district, landslide_type, trigger_type,
                source, year, latitude, longitude,
                ROUND(${haversineKm(lat, lon)}::numeric, 2) AS distance_km
         FROM landslide_events
         WHERE latitude BETWEEN $1 AND $2
           AND longitude BETWEEN $3 AND $4
           AND ${haversineKm(lat, lon)} <= $5
         ORDER BY distance_km
         LIMIT 200`,
        [lat - latDelta, lat + latDelta, lon - lonDelta, lon + lonDelta, radiusKm]
    );
    return result.rows;
};

exports.findByBbox = async (minLon, minLat, maxLon, maxLat, limit = 2000) => {
    const result = await db.query(
        `SELECT id, event_date, state, district, landslide_type, source, year, latitude, longitude
         FROM landslide_events
         WHERE latitude BETWEEN $2 AND $4
           AND longitude BETWEEN $1 AND $3
         ORDER BY event_date DESC NULLS LAST
         LIMIT $5`,
        [minLon, minLat, maxLon, maxLat, limit]
    );
    return result.rows;
};

exports.getDensity = async (lat, lon, radiusKm = 10) => {
    const latDelta = radiusKm / 111.0;
    const lonDelta = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180));
    const result = await db.query(
        `SELECT COUNT(*) as count FROM landslide_events
         WHERE latitude BETWEEN $1 AND $2
           AND longitude BETWEEN $3 AND $4
           AND ${haversineKm(lat, lon)} <= $5`,
        [lat - latDelta, lat + latDelta, lon - lonDelta, lon + lonDelta, radiusKm]
    );
    const count = parseInt(result.rows[0].count, 10);
    const areaKm2 = Math.PI * radiusKm * radiusKm;
    return { count, density_per_km2: parseFloat((count / areaKm2).toFixed(6)) };
};

exports.getHistoricalStats = async (filters = {}) => {
    const conditions = []; const params = [];
    if (filters.state) { params.push(filters.state); conditions.push(`state = $${params.length}`); }
    if (filters.year) { params.push(parseInt(filters.year)); conditions.push(`year = $${params.length}`); }
    const W = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const W2 = conditions.length ? `WHERE ${conditions.join(' AND ')} AND year IS NOT NULL` : 'WHERE year IS NOT NULL';
    const W3 = conditions.length ? `WHERE ${conditions.join(' AND ')} AND event_date IS NOT NULL` : 'WHERE event_date IS NOT NULL';
    const W4 = conditions.length ? `WHERE ${conditions.join(' AND ')} AND state IS NOT NULL` : 'WHERE state IS NOT NULL';
    const W5 = conditions.length ? `WHERE ${conditions.join(' AND ')} AND district IS NOT NULL` : 'WHERE district IS NOT NULL';
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const [t, y, s, m, d] = await Promise.all([
        db.query(`SELECT COUNT(*) as total FROM landslide_events ${W}`, params),
        db.query(`SELECT year, COUNT(*) as count FROM landslide_events ${W2} GROUP BY year ORDER BY year`, params),
        db.query(`SELECT state, COUNT(*) as count FROM landslide_events ${W4} GROUP BY state ORDER BY count DESC`, params),
        db.query(`SELECT EXTRACT(MONTH FROM event_date)::int as month, COUNT(*) as count FROM landslide_events ${W3} GROUP BY month ORDER BY month`, params),
        db.query(`SELECT district, state, COUNT(*) as count FROM landslide_events ${W5} GROUP BY district, state ORDER BY count DESC LIMIT 20`, params),
    ]);
    return {
        total: parseInt(t.rows[0].total),
        year_wise: y.rows.map(r => ({ year: parseInt(r.year), count: parseInt(r.count) })),
        state_wise: s.rows.map(r => ({ state: r.state, count: parseInt(r.count) })),
        monthly: m.rows.map(r => ({ month: monthNames[parseInt(r.month)-1], month_num: parseInt(r.month), count: parseInt(r.count) })),
        district_wise: d.rows.map(r => ({ district: r.district, state: r.state, count: parseInt(r.count) }))
    };
};
