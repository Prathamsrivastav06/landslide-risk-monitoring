const db = require('./db');

exports.createUser = async (userData) => {
    const { id, name, email, passwordHash, role, phone } = userData;
    const result = await db.query(
        `INSERT INTO users (id, full_name, email, password_hash, role, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, full_name as name, email, role, phone`,
        [id, name, email, passwordHash, role, phone]
    );
    return result.rows[0];
};

exports.findByEmail = async (email) => {
    const result = await db.query(
        `SELECT id, email, password_hash, full_name as name, role, phone, is_active
         FROM users WHERE email = $1`,
        [email]
    );
    return result.rows[0];
};

exports.findById = async (id) => {
    const result = await db.query(
        `SELECT id, email, full_name as name, role, phone, organization, is_active, created_at
         FROM users WHERE id = $1`,
        [id]
    );
    return result.rows[0];
};
