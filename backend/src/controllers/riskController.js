const { v4: uuidv4 } = require('uuid');
const riskAggregator = require('../services/riskAggregator');
const mlService = require('../services/mlService');
const alertEngine = require('../services/alertEngine');
const predictionsModel = require('../models/predictionsModel');
const { success, error, unavailable } = require('../utils/responseUtils');
const geoUtils = require('../utils/geoUtils');

exports.getRisk = async (req, res, next) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);

        if (isNaN(lat) || isNaN(lon)) return error(res, 'Invalid coordinates', 400);
        if (!geoUtils.isWithinNER(lat, lon)) {
            return success(res, {
                location: { lat, lon, state: 'Border Region', district: 'Outside NER Domain' },
                prediction: {
                    available: false,
                    reason: 'Selected location is outside the North Eastern Region monitoring domain (20°-30°N, 88°-98°E).',
                    risk_probability: null,
                    risk_class: 'LOW',
                    shap_values: {},
                    feature_importance: {},
                    model_version: 'rf_calibrated_v2.0'
                },
                environmental_data: {
                    rainfall: { available: false, reason: 'Outside NER monitoring domain' },
                    soil_moisture: { available: false, reason: 'Outside NER monitoring domain' },
                    terrain: { available: false, reason: 'Outside NER monitoring domain' },
                    historical: { count: 0, density_per_km2: 0, radius_km: 5, source: 'Database' }
                },
                alert_created: false,
                alert_id: null
            });
        }

        const locationContext = await riskAggregator.getLocationContext(lat, lon);
        const riskData = await riskAggregator.aggregateRiskData(lat, lon);
        
        let prediction = await mlService.getPrediction(riskData.features, lat, lon);
        
        if (!prediction.available) {
            // Save empty prediction record as fallback
            prediction = {
                available: false,
                reason: prediction.reason,
                risk_probability: null,
                risk_class: 'UNKNOWN',
                shap_values: {},
                feature_importance: {},
                model_version: 'offline'
            };
        }

        const predictionId = uuidv4();
        await predictionsModel.create({
            id: predictionId,
            lat, lon,
            riskProbability: prediction.risk_probability,
            riskClass: prediction.risk_class,
            modelVersion: prediction.model_version,
            shapValues: JSON.stringify(prediction.shap_values),
            features: JSON.stringify(riskData.features)
        });

        let alertId = null;
        if (prediction.available) {
            alertId = await alertEngine.createAlertFromPrediction(prediction, locationContext, predictionId);
        }

        success(res, {
            location: locationContext,
            prediction: {
                ...prediction,
                missing_features: riskData.missingFeatures
            },
            environmental_data: riskData.sources,
            alert_created: !!alertId,
            alert_id: alertId
        });
    } catch (err) { next(err); }
};

exports.simulate = async (req, res, next) => {
    try {
        const customFeatures = req.body.features || req.body || {};
        const lat = parseFloat(req.body.lat) || 27.33;
        const lon = parseFloat(req.body.lon) || 88.62;
        const locationName = req.body.locationName || 'Simulated NER Corridor';

        const prediction = mlService.simulate(customFeatures);

        let alertId = null;
        if (req.body.createAlert && (prediction.risk_class === 'CRITICAL' || prediction.risk_class === 'HIGH')) {
            const predictionId = uuidv4();
            await predictionsModel.create({
                id: predictionId,
                lat, lon,
                riskProbability: prediction.risk_probability,
                riskClass: prediction.risk_class,
                modelVersion: prediction.model_version,
                shapValues: prediction.shap_values,
                features: customFeatures
            });

            const locationContext = {
                lat, lon,
                district: locationName,
                state: req.body.state || 'Sikkim',
                pincode: '737101',
                source: 'Simulation Console'
            };
            alertId = await alertEngine.createAlertFromPrediction(prediction, locationContext, predictionId);
        }

        success(res, {
            prediction,
            features_evaluated: customFeatures,
            alert_created: !!alertId,
            alert_id: alertId
        });
    } catch (err) { next(err); }
};

