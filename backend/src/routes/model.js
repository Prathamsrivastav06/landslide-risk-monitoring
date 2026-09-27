const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');

router.get('/status', modelController.getStatus);
router.get('/metrics', modelController.getMetrics);

module.exports = router;
