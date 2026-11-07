const express = require('express');
const router = express.Router();

const authRoute = require('./auth.route');
const publicRoute = require('./public.route');
const wargaRoute = require('./warga.route');
const mitraRoute = require('./mitra.route');
const adminRoute = require('./admin.route');

router.get('/', (req, res) => {
  res.json({
    name: 'Trash Management Smart City & Circular Economy API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      public: '/api/public',
      warga: '/api/warga',
      mitra: '/api/mitra',
      admin: '/api/admin'
    }
  });
});

router.use('/auth', authRoute);
router.use('/public', publicRoute);
router.use('/warga', wargaRoute);
router.use('/mitra', mitraRoute);
router.use('/admin', adminRoute);

module.exports = router;
