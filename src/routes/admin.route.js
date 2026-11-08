const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Proteksi backend ketat: Hanya pengguna dengan peran 'admin' yang dapat mengakses seluruh endpoint ini
router.use(authenticate, authorize('admin'));

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

// Klaim Penukaran Sembako Warga
router.get('/claims', adminController.getClaims);
router.put('/claims/:id/verify', adminController.verifyClaim);

// Pengawasan & Supervisi Aduan Sampah Liar (Read-Only)
router.get('/reports', adminController.getReports);

// Monitoring Sirkular Ekonomi & Transaksi Bank Sampah
router.get('/pickups', adminController.getWasteBankPickups);

module.exports = router;
