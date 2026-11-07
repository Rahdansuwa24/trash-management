const express = require('express');
const router = express.Router();
const mitraController = require('../controllers/mitra.controller');
const { uploadSingle } = require('../middleware/upload.middleware');

router.get('/reports', mitraController.getAssignedReports);
router.post('/reports/:id/action', uploadSingle('file_foto_tindakan'), mitraController.submitCleanupAction);

router.get('/pickups', mitraController.getWasteBankPickups);
router.put('/transactions/:id/complete', mitraController.completeTransaction);

module.exports = router;
