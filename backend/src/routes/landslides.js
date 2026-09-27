const express = require('express');
const router = express.Router();
const landslidesController = require('../controllers/landslidesController');

router.get('/', landslidesController.getByBbox);
router.get('/nearby', landslidesController.getNearby);
router.get('/historical-analysis', landslidesController.getHistoricalAnalysis);

module.exports = router;
