const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

exports.sendAlertEmail = async (location, prediction) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('SMTP credentials not configured. Skipping email alert.');
        return false;
    }

    try {
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: '"Landslide Risk System" <alerts@landslidesih.in>',
            to: "authorities@example.com", // Normally fetched from DB by district
            subject: `🚨 HIGH LANDSLIDE RISK ALERT: ${location.district}, ${location.state}`,
            text: `High landslide risk detected at ${location.lat}, ${location.lon}. Risk Probability: ${prediction.risk_probability}. Please take immediate action.`
        });
        return true;
    } catch (error) {
        logger.error(`Email sending failed: ${error.message}`);
        return false;
    }
};
