const express = require('express');
const router = express.Router();
const dataSourcesController = require('../controllers/dataSourcesController');

router.get('/health', dataSourcesController.getHealth);

module.exports = router;
