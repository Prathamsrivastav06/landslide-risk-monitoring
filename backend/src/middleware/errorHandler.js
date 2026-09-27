const logger = require('../utils/logger');
const { error } = require('../utils/responseUtils');

exports.errorHandler = (err, req, res, next) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });

    if (err.name === 'ValidationError') {
        return error(res, err.message, 400);
    }

    if (err.name === 'UnauthorizedError') {
        return error(res, 'Unauthorized access', 401);
    }

    error(res, 'Internal Server Error', 500);
};
