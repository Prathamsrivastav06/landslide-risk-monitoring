const db = require('./db');

exports.create = async (reportData) => {
    const { id, userId, lat, lon, issueType, description, severity, photoUrl } = reportData;
    const isValidUuid = typeof userId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    const safeUserId = isValidUuid ? userId : null;

    const query = `
        INSERT INTO field_reports (id, user_id, latitude, longitude, geom, issue_type, description, severity, photo_url, verification_status)
        VALUES ($1, $2::uuid, $3::numeric, $4::numeric, ST_SetSRID(ST_MakePoint($4::double precision, $3::double precision), 4326), $5, $6, $7, $8, 'PENDING')
        RETURNING id, verification_status as status, created_at;
    `;
    const result = await db.query(query, [id, safeUserId, lat, lon, issueType, description, severity, photoUrl]);
    return result.rows[0];
};

exports.findAll = async (filters = {}, limit = 10, offset = 0) => {
    let query = `SELECT id, user_id, COALESCE(latitude, ST_Y(geom)) as lat, COALESCE(longitude, ST_X(geom)) as lon, issue_type, description, severity, photo_url, verification_status as status, created_at FROM field_reports WHERE 1=1`;
    const params = [];
    
    if (filters.status) {
        params.push(filters.status);
        query += ` AND verification_status = $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    const countQuery = `SELECT COUNT(*) FROM field_reports WHERE 1=1 ${filters.status ? `AND verification_status = '${filters.status}'` : ''}`;
    const countResult = await db.query(countQuery);
    
    return {
        data: result.rows,
        total: parseInt(countResult.rows[0].count)
    };
};

exports.updateStatus = async (id, status, notes, verifiedBy) => {
    const isValidUuid = typeof verifiedBy === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(verifiedBy);
    const safeVerifiedBy = isValidUuid ? verifiedBy : null;
    const query = `
        UPDATE field_reports 
        SET verification_status = $1, verified_by = $2::uuid, verified_at = NOW()
        WHERE id = $3
        RETURNING id, verification_status as status, verified_at, updated_at;
    `;
    const result = await db.query(query, [status, safeVerifiedBy, id]);
    return result.rows[0];
};
