const express = require('express');
const router = express.Router();
const wargaController = require('../controllers/warga.controller');
const { uploadSingle } = require('../middleware/upload.middleware');

router.get('/categories', wargaController.getCategories);
router.post('/transactions', uploadSingle('file_foto'), wargaController.createTransaction);
router.get('/transactions', wargaController.getMyTransactions);
router.get('/points', wargaController.getPointsAndHistory);

module.exports = router;
