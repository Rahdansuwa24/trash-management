const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// For dev/demo accessibility, we can allow open inspection or require admin
// Users & Stats
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/stats', adminController.getStats);

// Katalog Penukaran Poin (Sembako & Reward RT/RW)
router.get('/katalog', adminController.getKatalog);
router.post('/katalog', adminController.createKatalog);
router.put('/katalog/:id', adminController.updateKatalog);
router.patch('/katalog/:id/toggle', adminController.toggleKatalogStatus);
router.delete('/katalog/:id', adminController.deleteKatalog);

module.exports = router;
