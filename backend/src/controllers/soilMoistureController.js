const nasaSMAP = require('../services/nasaSMAP');
const { success, error } = require('../utils/responseUtils');

exports.getSoilMoisture = async (req, res, next) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);
        if (isNaN(lat) || isNaN(lon)) return error(res, 'Invalid coordinates', 400);

        const data = await nasaSMAP.getSoilMoisture(lat, lon);
        success(res, data);
    } catch (err) { next(err); }
};
