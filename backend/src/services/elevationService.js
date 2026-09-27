const axios = require('axios');
const logger = require('../utils/logger');
const cacheService = require('../cache/cacheService');

exports.getTerrainData = async (lat, lon) => {
    const cacheKey = `terrain_${lat}_${lon}`;
    const cached = cacheService.get(cacheKey, 'terrain');
    if (cached) return cached;

    try {
        const offset = 0.0009; // ~100m in degrees
        const locations = [
            `${lat},${lon}`,
            `${lat+offset},${lon}`,
            `${lat-offset},${lon}`,
            `${lat},${lon+offset}`,
            `${lat},${lon-offset}`
        ].join('|');

        const url = `https://api.open-elevation.com/api/v1/lookup?locations=${locations}`;
        const response = await axios.get(url, { timeout: 20000 });
        
        if (!response.data || !response.data.results || response.data.results.length < 5) {
            throw new Error('Invalid Open-Elevation response');
        }

        const elevs = response.data.results.map(r => r.elevation);
        const zC = elevs[0];
        const zN = elevs[1];
        const zS = elevs[2];
        const zE = elevs[3];
        const zW = elevs[4];

        // finite difference ~ 200m distance
        const distanceX = 200; 
        const distanceY = 200; 
        
        const dzdx = (zE - zW) / distanceX;
        const dzdy = (zN - zS) / distanceY;
        
        const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));
        const slopeDegree = slopeRad * (180 / Math.PI);

        const result = {
            available: true,
            elevation_m: zC,
            slope_degree: parseFloat(slopeDegree.toFixed(2)),
            source: 'SRTM via open-elevation.com',
            computed_at: new Date().toISOString()
        };

        cacheService.set(cacheKey, result, parseInt(process.env.TERRAIN_CACHE_TTL || 86400), 'terrain');
        return result;
    } catch (error) {
        logger.error('Open-Elevation API Error: ' + error.message);
        return {
            available: false,
            elevation_m: null,
            slope_degree: null,
            reason: 'Elevation service unavailable',
            source: 'SRTM via open-elevation.com'
        };
    }
};
