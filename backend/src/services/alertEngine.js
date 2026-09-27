const { v4: uuidv4 } = require('uuid');
const alertsModel = require('../models/alertsModel');
const logger = require('../utils/logger');
const emailService = require('./emailService');

exports.createAlertFromPrediction = async (prediction, locationContext, predictionId) => {
    const threshold = parseFloat(process.env.ALERT_TRIGGER_THRESHOLD || 0.50);
    
    if (prediction.risk_probability >= threshold) {
        const alertId = uuidv4();
        await alertsModel.create({
            id: alertId,
            predictionId,
            lat: locationContext.lat,
            lon: locationContext.lon,
            riskProbability: prediction.risk_probability,
            riskClass: prediction.risk_class,
            state: locationContext.state,
            district: locationContext.district
        });

        logger.info(`Alert Created: ${alertId} for risk ${prediction.risk_probability}`);
        
        // Attempt sending email
        await emailService.sendAlertEmail(locationContext, prediction);

        return alertId;
    }
    return null;
};
