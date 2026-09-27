const axios = require('axios');
const nasaGPM = require('./nasaGPM');
const nasaSMAP = require('./nasaSMAP');
const terrainService = require('./terrainService');
const landslidesModel = require('../models/landslidesModel');
const logger = require('../utils/logger');

exports.aggregateRiskData = async (lat, lon) => {
    const rainfall = await nasaGPM.getRainfallData(lat, lon);
    const soilMoisture = await nasaSMAP.getSoilMoisture(lat, lon);
    const terrain = await terrainService.getTerrainFeatures(lat, lon);
    const historical = await landslidesModel.getDensity(lat, lon, 5); // 5km radius

    const features = {};
    const missingFeatures = [];

    if (rainfall.available) {
        features.rainfall_24h = rainfall.rainfall_24h_mm;
        features.rainfall_3d = rainfall.rainfall_3d_mm;
        features.rainfall_7d = rainfall.rainfall_7d_mm;
        features.rainfall_24h_mm = rainfall.rainfall_24h_mm;
        features.rainfall_3d_mm = rainfall.rainfall_3d_mm;
        features.rainfall_7d_mm = rainfall.rainfall_7d_mm;
    } else {
        missingFeatures.push('rainfall');
    }

    if (terrain.available) {
        features.elevation = terrain.elevation_m;
        features.slope = terrain.slope_degree;
        features.elevation_m = terrain.elevation_m;
        features.slope_degree = terrain.slope_degree;
    } else {
        missingFeatures.push('terrain');
    }

    if (soilMoisture.available) {
        features.soil_moisture = soilMoisture.value;
    } else {
        missingFeatures.push('soil_moisture');
    }

    features.historical_density = historical.density_per_km2;
    features.historical_landslide_density = historical.density_per_km2;
    features.historical_landslide_count = historical.count || 0;

    return {
        features,
        missingFeatures,
        sources: {
            rainfall,
            soil_moisture: soilMoisture,
            terrain,
            historical: { ...historical, radius_km: 5, source: 'Database' }
        }
    };
};

exports.getLocationContext = async (lat, lon) => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'LandslideRiskSystem/1.0' },
            timeout: 10000
        });
        
        if (response.data && response.data.address) {
            return {
                lat,
                lon,
                state: response.data.address.state || 'Unknown',
                district: response.data.address.state_district || response.data.address.county || 'Unknown',
                name: response.data.name || ''
            };
        }
    } catch (error) {
        logger.error(`Nominatim reverse geocode error: ${error.message}`);
    }
    return { lat, lon, state: 'Unknown', district: 'Unknown' };
};
