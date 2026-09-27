const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');
const { optionalAuthenticate } = require('../middleware/auth');

router.get('/', optionalAuthenticate, alertsController.getAlerts);
router.post('/:id/verify', optionalAuthenticate, alertsController.verifyAlert);

module.exports = router;
