const terrainService = require('../services/terrainService');
const { success, error } = require('../utils/responseUtils');

exports.getTerrain = async (req, res, next) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);
        if (isNaN(lat) || isNaN(lon)) return error(res, 'Invalid coordinates', 400);

        const data = await terrainService.getTerrainFeatures(lat, lon);
        success(res, data);
    } catch (err) { next(err); }
};
