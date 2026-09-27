const landslidesModel = require('../models/landslidesModel');
const { success, error } = require('../utils/responseUtils');
const geoUtils = require('../utils/geoUtils');

exports.getNearby = async (req, res, next) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);
        const radius = parseFloat(req.query.radius) || 5;
        if (isNaN(lat) || isNaN(lon)) return error(res, 'Invalid coordinates', 400);
        const events = await landslidesModel.findNearby(lat, lon, radius);
        const density = await landslidesModel.getDensity(lat, lon, radius);
        success(res, {
            events,
            count: events.length,
            density_per_km2: density.density_per_km2,
            radius_km: radius,
            source: 'ISRO/GSI Historical Inventory (Database)'
        });
    } catch (err) { next(err); }
};

exports.getByBbox = async (req, res, next) => {
    try {
        const bbox = req.query.bbox;
        if (!bbox) return error(res, 'bbox parameter required (minLon,minLat,maxLon,maxLat)', 400);
        const parts = bbox.split(',').map(Number);
        if (parts.length !== 4 || parts.some(isNaN)) return error(res, 'Invalid bbox format', 400);
        const [minLon, minLat, maxLon, maxLat] = parts;
        const limit = parseInt(req.query.limit) || 2000;
        const landslides = await landslidesModel.findByBbox(minLon, minLat, maxLon, maxLat, limit);
        success(res, {
            landslides,
            total: landslides.length,
            bbox: { minLon, minLat, maxLon, maxLat }
        });
    } catch (err) { next(err); }
};

exports.getHistoricalAnalysis = async (req, res, next) => {
    try {
        const filters = {
            state: req.query.state || '',
            year: req.query.year || '',
            source: req.query.source || '',
            type: req.query.type || ''
        };
        const stats = await landslidesModel.getHistoricalStats(filters);
        success(res, {
            ...stats,
            filters_applied: filters,
            source: 'ISRO/GSI Historical Inventory (Database)',
            note: 'Data from ISRO NRSC Landslide Atlas and GSI inventory. Import data using scripts/import_isro_landslides.py'
        });
    } catch (err) { next(err); }
};
