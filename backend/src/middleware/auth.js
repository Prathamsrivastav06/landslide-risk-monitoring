const jwt = require('jsonwebtoken');
const { error } = require('../utils/responseUtils');

exports.authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return error(res, 'Authentication required', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return error(res, 'Invalid or expired token', 401);
    }
};

exports.optionalAuthenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
    } catch (err) {
        // Continue unauthenticated for public preview
    }
    next();
};

exports.verifyToken = exports.authenticate;
