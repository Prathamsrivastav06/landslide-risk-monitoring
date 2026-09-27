const db = require('../models/db');
const axios = require('axios');
const { success } = require('../utils/responseUtils');

exports.getHealth = async (req, res, next) => {
    try {
        // Get all data sources from DB
        let sources = [];
        try {
            const result = await db.query('SELECT * FROM data_sources ORDER BY name');
            sources = result.rows;
        } catch (e) {
            sources = [];
        }

        // Run all health checks concurrently for ultra-fast response
        const [nasaPowerStatus, elevationStatus, mlStatus, dbStatus] = await Promise.all([
            checkNasaPower(),
            checkOpenElevation(),
            checkMLService(),
            db.query('SELECT 1').then(() => 'CONNECTED').catch(() => 'UNAVAILABLE')
        ]);

        // Update source statuses with live check results
        const sourceStatuses = sources.map(s => {
            let status = s.sync_status || 'UNKNOWN';
            if (s.name === 'NASA_GPM_IMERG') status = nasaPowerStatus;
            if (s.name === 'SRTM_ELEVATION' || s.name === 'OPEN_ELEVATION') status = elevationStatus;
            return {
                name: s.name,
                display_name: s.display_name,
                source_type: s.source_type,
                status,
                last_sync: s.last_sync,
                record_count: s.record_count,
                requires_auth: s.requires_auth,
                notes: s.notes
            };
        });

        // Add static entries if DB is empty
        if (sourceStatuses.length === 0) {
            sourceStatuses.push(
                { name: 'NASA_GPM_IMERG', display_name: 'NASA POWER Precipitation', source_type: 'rainfall', status: nasaPowerStatus, requires_auth: false },
                { name: 'NASA_SMAP', display_name: 'NASA SMAP Soil Moisture', source_type: 'soil_moisture', status: process.env.NASA_EARTHDATA_USERNAME ? 'AVAILABLE' : 'NOT_CONFIGURED', requires_auth: true },
                { name: 'SRTM_ELEVATION', display_name: 'SRTM via open-elevation.com', source_type: 'dem', status: elevationStatus, requires_auth: false },
                { name: 'ISRO_NRSC_LANDSLIDES', display_name: 'ISRO/NRSC Landslide Atlas', source_type: 'historical_landslides', status: 'MANUAL_IMPORT_REQUIRED', requires_auth: false }
            );
        }

        success(res, {
            sources: sourceStatuses,
            system: {
                database: dbStatus,
                ml_service: mlStatus,
                api_server: 'ONLINE'
            },
            checked_at: new Date().toISOString()
        });
    } catch (err) { next(err); }
};

async function checkNasaPower() {
    try {
        await axios.get('https://power.larc.nasa.gov/api/temporal/daily/point', {
            params: { parameters: 'PRECTOTCORR', community: 'RE', longitude: 88.61, latitude: 27.33, start: '20240101', end: '20240101', format: 'JSON' },
            timeout: 3000
        });
        return 'CONNECTED';
    } catch (e) {
        return e.code === 'ECONNABORTED' ? 'TIMEOUT' : 'UNAVAILABLE';
    }
}

async function checkOpenElevation() {
    try {
        await axios.get('https://api.open-elevation.com/api/v1/lookup?locations=27.33,88.61', { timeout: 3000 });
        return 'CONNECTED';
    } catch (e) {
        return 'UNAVAILABLE';
    }
}

async function checkMLService() {
    try {
        const url = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        await axios.get(`${url}/health`, { timeout: 3000 });
        return 'ONLINE';
    } catch (e) {
        return 'OFFLINE';
    }
}
