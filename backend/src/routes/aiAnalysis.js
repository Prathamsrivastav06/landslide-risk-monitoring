const express = require('express');
const router = express.Router();
const groqAnalysis = require('../services/groqAnalysis');
const terrainService = require('../services/terrainService');
const landslidesModel = require('../models/landslidesModel');
const riskAggregator = require('../services/riskAggregator');
const { success, error } = require('../utils/responseUtils');
const geoUtils = require('../utils/geoUtils');

// POST /api/ai-analysis
router.post('/', async (req, res, next) => {
    try {
        const lat = parseFloat(req.body.lat);
        const lon = parseFloat(req.body.lon);
        const locationName = req.body.locationName || null;

        if (isNaN(lat) || isNaN(lon)) return error(res, 'Invalid coordinates', 400);
        if (!geoUtils.isWithinNER(lat, lon)) {
            return success(res, {
                available: false,
                analysis: {
                    risk_score: 10,
                    risk_level: 'LOW',
                    confidence: 'Low',
                    headline: 'Selected coordinates are outside the North Eastern Region monitoring zone.',
                    key_findings: ['Point lies outside NER boundary (20°-30°N, 88°-98°E).'],
                    data_quality_note: 'NER domain boundary restriction'
                }
            });
        }

        // Gather terrain + historical landslides in parallel
        const [terrain, historicalLandslides, locationCtx] = await Promise.all([
            terrainService.getTerrainFeatures(lat, lon).catch(() => null),
            landslidesModel.getDensity(lat, lon, 5).catch(() => ({ count: 0, density_per_km2: 0 })),
            riskAggregator.getLocationContext(lat, lon).catch(() => ({ state: 'Unknown', district: 'Unknown' }))
        ]);

        const name = locationCtx?.district !== 'Unknown'
            ? `${locationCtx.district}, ${locationCtx.state}`
            : locationName;

        const result = await groqAnalysis.analyzeLocation({
            lat, lon, terrain, historicalLandslides, locationName: name
        });

        success(res, result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
