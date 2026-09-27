exports.success = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({ success: true, data });
};

exports.error = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({ success: false, error: message });
};

exports.unavailable = (res, source, reason, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data: {
            available: false,
            reason,
            source
        }
    });
};

exports.paginated = (res, data, total, page, limit) => {
    return res.status(200).json({
        success: true,
        data,
        pagination: {
            total: parseInt(total),
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        }
    });
};
