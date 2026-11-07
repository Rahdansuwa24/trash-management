const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const { uploadFields } = require('../middleware/upload.middleware');

router.post(
  '/reports',
  uploadFields([
    { name: 'file_foto', maxCount: 1 },
    { name: 'file_video', maxCount: 1 }
  ]),
  publicController.createIllegalReport
);

router.get('/reports/ticket/:code', publicController.lookupTicket);
router.get('/reports/map', publicController.getMapReports);

module.exports = router;
