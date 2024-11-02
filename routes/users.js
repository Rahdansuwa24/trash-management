var express = require('express');
var router = express.Router();
const Model_Users = require('../Model/Model_Users');
const Model_Device = require('../Model/Model_Device');

const ensureWarga = (req, res, next) => {
    if (req.session.userID && req.session.role_users == 'warga') {
      return next();
    } else {
      req.flash('error','Anda tida memiliki izin untuk halaman ini !!');
      res.redirect('/login')
    }
  };

  const ensureMitra = (req, res, next) => {
    if (req.session.userID && req.session.role_users == 'mitra') {
      return next();
    } else {
      req.flash('error','Anda tida memiliki izin untuk halaman ini !!');
      res.redirect('/login')
    }
  };

  const checkAccountStatus = async (req, res, next) => {
    const id = req.session.userID;
    const user = await Model_Users.getId(id);
  
    if (user && user.status === 'frozen') {
      req.flash('error', 'Akun Anda dibekukan. Silakan hubungi administrator.');
      return res.redirect('/login');
    }
    next();
  };

  const checkDeviceStatus = async (req, res, next) => {
    const macAddress = req.headers['mac_address'];
  
    if (!macAddress) {
      req.flash('error', 'Perangkat tidak dikenali.');
      return res.redirect('/login');
    }
  
    const statusDevice = await Model_Device.getStatusByMacAddress(macAddress);
    
    if (statusDevice === 'blocked') {
      req.flash('error', 'Akses diblokir untuk perangkat ini. Silakan hubungi administrator.');
      return res.redirect('/login');
    }
  
    next();
  };

router.get('/warga', function(req, res, next) {
    res.render('users/index');
});

router.get('/warga/sell', function(req, res, next) {
    res.render('users/sell');
});

module.exports = router;
