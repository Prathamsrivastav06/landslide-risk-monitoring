const rateLimit = require('express-rate-limit');

exports.generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes' }
});

exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Too many authentication attempts, please try again later' }
});
