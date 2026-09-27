const landslidesModel = require('../models/landslidesModel');

exports.getNearbyLandslides = async (lat, lon, radiusKm = 5) => {
    return await landslidesModel.findNearby(lat, lon, radiusKm);
};

exports.getLandslidesByBbox = async (minLon, minLat, maxLon, maxLat) => {
    return await landslidesModel.findByBbox(minLon, minLat, maxLon, maxLat);
};

exports.getLandslideStats = async () => {
    return await landslidesModel.getHistoricalStats();
};
