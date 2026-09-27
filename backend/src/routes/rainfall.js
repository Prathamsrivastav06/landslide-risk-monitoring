const express = require('express');
const router = express.Router();
const rainfallController = require('../controllers/rainfallController');

router.get('/', rainfallController.getRainfall);

module.exports = router;
