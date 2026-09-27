const express = require('express');
const router = express.Router();
const soilMoistureController = require('../controllers/soilMoistureController');

router.get('/', soilMoistureController.getSoilMoisture);

module.exports = router;
