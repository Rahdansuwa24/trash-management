const express = require('express');
const router = express.Router();
const mitraController = require('../controllers/mitra.controller');
const { uploadAny } = require('../middleware/upload.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Proteksi backend ketat: Hanya petugas 'mitra' dan 'admin' yang dapat mengakses operasional lapangan & bank sampah
router.use(authenticate, authorize('mitra', 'admin'));

router.get('/reports', mitraController.getAssignedReports);
router.post('/reports/:id/action', uploadAny(), mitraController.submitCleanupAction);

router.get('/pickups', mitraController.getWasteBankPickups);
router.put('/pickups/:id/claim', mitraController.claimPickup);
router.put('/transactions/:id/complete', mitraController.completeTransaction);

module.exports = router;
