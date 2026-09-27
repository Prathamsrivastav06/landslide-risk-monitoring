const db = require('./db');

exports.create = async (predData) => {
    const { id, lat, lon, riskProbability, riskClass, modelVersion, shapValues, features } = predData;
    const result = await db.query(
        `INSERT INTO risk_predictions (id, latitude, longitude, risk_probability, risk_class, model_version, shap_values, feature_snapshot)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [id, lat, lon, riskProbability, riskClass, modelVersion,
         JSON.stringify(shapValues), JSON.stringify(features)]
    );
    return result.rows[0];
};

exports.findRecent = async (lat, lon, hours = 24) => {
    const result = await db.query(
        `SELECT * FROM risk_predictions
         WHERE latitude BETWEEN $1 AND $2
           AND longitude BETWEEN $3 AND $4
           AND created_at > NOW() - INTERVAL '${hours} hours'
         ORDER BY created_at DESC LIMIT 1`,
        [lat - 0.05, lat + 0.05, lon - 0.05, lon + 0.05]
    );
    return result.rows[0] || null;
};
