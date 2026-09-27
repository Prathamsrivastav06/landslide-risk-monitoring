const logger = require('../utils/logger');

exports.sendAlertSms = async (phone, message) => {
    if (!process.env.SMS_PROVIDER_KEY) {
        logger.warn('SMS_PROVIDER_KEY not configured. Skipping SMS.');
        return false;
    }

    try {
        // Implement provider logic (e.g., Twilio, Msg91) here
        logger.info(`SMS Sent to ${phone}: ${message}`);
        return true;
    } catch (error) {
        logger.error(`SMS sending failed: ${error.message}`);
        return false;
    }
};
