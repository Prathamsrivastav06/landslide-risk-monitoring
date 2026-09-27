const db = require('./db');

exports.create = async (alertData) => {
    const { id, predictionId, lat, lon, riskProbability, riskClass, state, district, topFactors } = alertData;
    const result = await db.query(
        `INSERT INTO alerts (id, prediction_id, latitude, longitude, risk_probability, risk_class, state, district, status, top_factors)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PREDICTED', $9)
         RETURNING id`,
        [id, predictionId, lat, lon, riskProbability, riskClass, state, district,
         JSON.stringify(topFactors || [])]
    );
    return result.rows[0];
};

exports.findAll = async (filters = {}, limit = 20, offset = 0) => {
    let query = `SELECT id, prediction_id, latitude, longitude, risk_probability, risk_class,
                        state, district, status, top_factors, created_at, updated_at
                 FROM alerts WHERE 1=1`;
    const params = [];
    if (filters.status) { params.push(filters.status); query += ` AND status = $${params.length}`; }
    if (filters.risk_class) { params.push(filters.risk_class); query += ` AND risk_class = $${params.length}`; }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await db.query(query, params);
    const countQ = `SELECT COUNT(*) FROM alerts WHERE 1=1 ${filters.status ? `AND status = '${filters.status}'` : ''}`;
    const countResult = await db.query(countQ);
    return { data: result.rows, total: parseInt(countResult.rows[0].count) };
};

exports.updateStatus = async (id, status, verifiedBy, dismissedReason) => {
    const isValidUuid = typeof verifiedBy === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(verifiedBy);
    const safeVerifiedBy = isValidUuid ? verifiedBy : null;
    const reason = dismissedReason || (typeof verifiedBy === 'string' && !isValidUuid ? verifiedBy : null);

    const result = await db.query(
        `UPDATE alerts SET status = $1::varchar, verified_by = $2::uuid, dismissed_reason = $3::text,
                          verified_at = CASE WHEN $1::varchar != 'PREDICTED' THEN NOW() ELSE NULL END,
                          updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [status, safeVerifiedBy, reason, id]
    );
    return result.rows[0];
};

exports.findById = async (id) => {
    const result = await db.query('SELECT * FROM alerts WHERE id = $1', [id]);
    return result.rows[0] || null;
};
