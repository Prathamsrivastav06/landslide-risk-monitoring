const express = require('express');
const router = express.Router();
const fieldReportsController = require('../controllers/fieldReportsController');
const { optionalAuthenticate } = require('../middleware/auth');
const { uploadPhoto } = require('../middleware/fileValidator');

// Public or Citizen route
router.post('/', uploadPhoto.single('photo'), fieldReportsController.createReport);

// Inspection routes with optional auth for demo/evaluation
router.get('/', optionalAuthenticate, fieldReportsController.getReports);
router.post('/:id/verify', optionalAuthenticate, fieldReportsController.verifyReport);

module.exports = router;
