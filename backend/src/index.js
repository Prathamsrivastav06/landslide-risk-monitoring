const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const db = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', generalLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/risk', require('./routes/risk'));
app.use('/api/rainfall', require('./routes/rainfall'));
app.use('/api/soil-moisture', require('./routes/soilMoisture'));
app.use('/api/terrain', require('./routes/terrain'));
app.use('/api/landslides', require('./routes/landslides'));
app.use('/api/field-reports', require('./routes/fieldReports'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/model', require('./routes/model'));
app.use('/api/data-sources', require('./routes/dataSources'));
app.use('/api/ai-analysis', require('./routes/aiAnalysis'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.use(errorHandler);

if (require.main === module) {
    app.listen(PORT, async () => {
        logger.info(`Server running on port ${PORT}`);
        try {
            await db.query('SELECT 1');
            logger.info('Database connection successful');
        } catch (err) {
            logger.error('Database connection failed', err);
        }
    });
}

module.exports = app;
