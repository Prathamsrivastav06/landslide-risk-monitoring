const alertsModel = require('../models/alertsModel');
const { success, error, paginated } = require('../utils/responseUtils');

exports.getAlerts = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await alertsModel.findAll({ status }, limit, offset);
        paginated(res, result.data, result.total, page, limit);
    } catch (err) { next(err); }
};

exports.verifyAlert = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes, dismissal_reason } = req.body;
        
        if (!['UNDER_VERIFICATION', 'VERIFIED', 'DISMISSED'].includes(status)) {
            return error(res, 'Invalid status', 400);
        }

        const verifiedBy = req.user?.id || null;
        const noteText = notes || dismissal_reason || null;
        const alert = await alertsModel.updateStatus(id, status, verifiedBy, noteText);
        if (!alert) return error(res, 'Alert not found', 404);
        
        success(res, alert);
    } catch (err) { next(err); }
};
