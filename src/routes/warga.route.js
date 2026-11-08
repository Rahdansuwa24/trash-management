const express = require('express');
const router = express.Router();
const wargaController = require('../controllers/warga.controller');
const { uploadSingle } = require('../middleware/upload.middleware');
const { optionalAuth, authenticate } = require('../middleware/auth.middleware');

router.get('/categories', wargaController.getCategories);
router.get('/katalog', wargaController.getKatalog);
router.post('/katalog/redeem', authenticate, wargaController.redeemReward);
router.post('/katalog/claim', authenticate, wargaController.claimReward);
router.get('/claims', authenticate, wargaController.getMyClaims);
router.post('/simulation/add-points', authenticate, wargaController.simulationAddPoints);
router.post('/transactions', optionalAuth, uploadSingle('file_foto'), wargaController.createTransaction);
router.get('/transactions', optionalAuth, wargaController.getMyTransactions);
router.get('/points', optionalAuth, wargaController.getPointsAndHistory);

module.exports = router;
