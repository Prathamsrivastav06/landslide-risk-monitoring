const express = require('express');
const router = express.Router();
const terrainController = require('../controllers/terrainController');

router.get('/', terrainController.getTerrain);

module.exports = router;
