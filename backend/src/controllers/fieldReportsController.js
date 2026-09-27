const fieldReportsModel = require('../models/fieldReportsModel');
const { v4: uuidv4 } = require('uuid');
const { success, error, paginated } = require('../utils/responseUtils');

exports.createReport = async (req, res, next) => {
    try {
        const { lat, lon, issue_type, description, severity } = req.body;
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
        
        if (!lat || !lon || !issue_type) return error(res, 'Missing required fields', 400);

        const report = await fieldReportsModel.create({
            id: uuidv4(),
            userId: req.user ? req.user.id : null,
            lat, lon, issueType: issue_type, description, severity, photoUrl
        });

        success(res, report, 201);
    } catch (err) { next(err); }
};

exports.getReports = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const result = await fieldReportsModel.findAll({ status }, limit, offset);
        paginated(res, result.data, result.total, page, limit);
    } catch (err) { next(err); }
};

exports.verifyReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { verification_status, verification_notes } = req.body;
        
        const report = await fieldReportsModel.updateStatus(id, verification_status, verification_notes, req.user?.id);
        if (!report) return error(res, 'Report not found', 404);
        
        success(res, report);
    } catch (err) { next(err); }
};
