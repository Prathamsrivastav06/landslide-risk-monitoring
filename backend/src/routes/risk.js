const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');

router.get('/', riskController.getRisk);
router.post('/predict', riskController.getRisk); // allows same flow for now
router.post('/simulate', riskController.simulate);

module.exports = router;
