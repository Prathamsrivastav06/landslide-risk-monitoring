const logger = require('../utils/logger');

exports.getSoilMoisture = async (lat, lon) => {
    if (!process.env.NASA_EARTHDATA_USERNAME) {
        return {
            available: false,
            reason: 'NASA SMAP credentials not configured',
            source: 'NASA SMAP L3'
        };
    }

    try {
        // Mock fallback as NASA SMAP requires complex HDF5 parsing locally which goes beyond a simple request
        // In a true environment, we'd hit Earthdata CMR API and process granules.
        throw new Error('Earthdata integration requires local HDF5 parsing capabilities');
    } catch (error) {
        logger.warn(`SMAP Fetch failed: ${error.message}`);
        return {
            available: false,
            reason: 'NASA SMAP credentials not configured or data unavailable',
            source: 'NASA SMAP L3'
        };
    }
};
