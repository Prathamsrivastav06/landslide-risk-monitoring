const elevationService = require('./elevationService');
const db = require('../models/db');
const logger = require('../utils/logger');

exports.getTerrainFeatures = async (lat, lon) => {
    // Could optionally query a local DEM database table first before hitting external APIs
    // For this implementation, we rely on the elevationService + node-cache.
    return await elevationService.getTerrainData(lat, lon);
};
