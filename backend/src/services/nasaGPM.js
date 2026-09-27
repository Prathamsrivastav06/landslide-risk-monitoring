const axios = require('axios');
const logger = require('../utils/logger');

// Try to get rainfall data from cacheService - adapt to whatever export it has
let cacheService;
try { cacheService = require('../cache/cacheService'); } catch(e) { cacheService = null; }

const NASA_POWER_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';

async function fetchPowerWindow(lat, lon, startStr, endStr) {
    const params = {
        parameters: 'PRECTOTCORR', community: 'RE',
        longitude: lon, latitude: lat,
        start: startStr, end: endStr,
        format: 'JSON', user: 'SIH_LandslideSystem'
    };
    const response = await axios.get(NASA_POWER_URL, { params, timeout: 3500 });
    return response.data.properties.parameter.PRECTOTCORR;
}

const fmtDate = (d) => d.toISOString().split('T')[0].replace(/-/g, '');

exports.getRainfallData = async (lat, lon) => {
    // Try to get from cache
    const cacheKey = `rainfall_${Math.round(lat * 5) / 5}_${Math.round(lon * 5) / 5}`;
    if (cacheService && cacheService.get) {
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;
    }
    
    try {
        let baseDate = new Date();
        if (baseDate.getFullYear() > 2024) {
            baseDate = new Date('2024-01-01T00:00:00Z');
        }
        // NASA POWER MERRA-2 has a multi-month lag
        const offsets = [0, 3, 6]; // months back from capped date
        
        let validData = null;
        let obsDate = null;
        
        for (const offsetMonths of offsets) {
            const endD = new Date(baseDate);
            endD.setMonth(endD.getMonth() - offsetMonths);
            const startD = new Date(endD);
            startD.setDate(startD.getDate() - 10);
            
            try {
                const raw = await fetchPowerWindow(lat, lon, fmtDate(startD), fmtDate(endD));
                const sortedKeys = Object.keys(raw).sort();
                const validPairs = sortedKeys
                    .map(k => ({ date: k, val: raw[k] }))
                    .filter(p => p.val !== -999 && p.val >= 0);
                
                if (validPairs.length >= 3) {
                    validData = validPairs;
                    obsDate = validPairs[validPairs.length - 1].date;
                    break;
                }
            } catch (fetchErr) {
                logger.warn('NASA POWER window attempt failed: ' + fetchErr.message);
                continue;
            }
        }
        
        if (!validData || validData.length === 0) {
            return {
                available: false,
                reason: 'NASA POWER MERRA-2 precipitation data not yet processed for any available period. Data has multi-month processing lag.',
                source: 'NASA POWER (MERRA-2)',
                data_type: 'Satellite/reanalysis precipitation estimate'
            };
        }
        
        const values = validData.map(p => p.val);
        const obsDateFormatted = `${obsDate.substring(0,4)}-${obsDate.substring(4,6)}-${obsDate.substring(6,8)}`;
        
        const result = {
            available: true,
            rainfall_24h_mm: parseFloat(values[values.length - 1].toFixed(2)),
            rainfall_3d_mm: parseFloat(values.slice(-3).reduce((a, b) => a + b, 0).toFixed(2)),
            rainfall_7d_mm: parseFloat(values.slice(-7).reduce((a, b) => a + b, 0).toFixed(2)),
            source: 'NASA POWER (MERRA-2)',
            observation_time: obsDateFormatted,
            data_type: 'Satellite/reanalysis precipitation estimate',
            data_age_note: `Latest available observation: ${obsDateFormatted}. MERRA-2 reanalysis has a multi-month processing lag. This is NOT live sensor data.`,
            spatial_resolution: '0.5 degree (~55 km)',
            is_live: false
        };
        
        // Cache it
        if (cacheService && cacheService.set) {
            try { cacheService.set(cacheKey, result); } catch(e) {}
        }
        
        return result;
    } catch (error) {
        logger.error('NASA POWER API Error: ' + error.message);
        return {
            available: false,
            reason: `NASA POWER API unavailable: ${error.message}`,
            source: 'NASA POWER (MERRA-2)'
        };
    }
};
