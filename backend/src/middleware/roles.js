const { error } = require('../utils/responseUtils');

exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return error(res, 'Insufficient permissions', 403);
        }
        next();
    };
};
