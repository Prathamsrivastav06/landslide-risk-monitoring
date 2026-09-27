const db = require('./db');

exports.getHealthMetrics = async () => {
    // Note: Health states usually dynamically computed, but you can store downtime events in DB.
    return {
        status: 'UP'
    };
};
