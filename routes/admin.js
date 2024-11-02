var express = require('express');
var router = express.Router();
const Model_Warga = require('../Model/Model_Warga');
const Model_Users = require('../Model/Model_Users');
const Model_Device = require('../Model/Model_Device');

const ensureAuthenticated = (req, res, next) => {
    if (req.session.userID && req.session.role_users == 'warga') {
      return next();
    } else {
      req.flash('error','Anda tida memiliki izin untuk halaman ini !!');
      res.redirect('/login')
    }
  };

router.get('/data-users', ensureAuthenticated, async(req, res, next) =>{
    let id = req.session.userID;
    let user = await Model_Users.getId(id);

    let Data = await Model_Users.getAll();
    if(user.length > 0){
        res.render('admin/data-user');
    }
})

router.get('/data-warga', ensureAuthenticated, async(req, res, next) =>{
    let id = req.session.userID;
    let user = await Model_Users.getId(id)

    let Data = await Model_Warga.getAll();
    if(user.length > 0){
        res.render('admin/data-warga', {
            title: 'Data Warga',
            Data
        })
    }
})



router.get('/delete-user/:id', ensureAuthenticated, async (req, res, next) => {
  try {
      const id = req.params.id_d;
      await Model_Users.Delete(id);
      
      req.flash('success','Berhasil Menghapus User');
      res.redirect('/admin/dashboard');
  } catch (error) {
      req.flash('error','Terjadi kesalahan pada fungsi');
      res.redirect('/admin/dashboard')
  }
})


router.post('/admin/freeze-account/:id', ensureAuthenticated, async(req, res)=>{
  try {
    const id = req.params.id;
    await Model_Users.freezeAcc(id);
    req.flash('success','Berhasil Membekukan Akun');
    res.redirect('/admin/dashboard')
  } catch (error) {
    req.flash('error','Terjadi kesalahan pada fungsi');
    res.redirect('/admin/dashboard')
  }
})

router.post('/admin/unfreeze-account/:id', ensureAuthenticated, async(req, res)=>{
  try {
    const id = req.params.id;
    await Model_Users.unfreezeAcc(id);
    req.flash('success','Berhasil Membuka pembekuan Akun');
    res.redirect('/admin/dashboard')
  } catch (error) {
    req.flash('error','Terjadi kesalahan pada fungsi');
    res.redirect('/admin/dashboard')
  }
})

router.post('/admin/block-device/:macAddress', async (req, res) => {
  try {
    const macAddress = req.params.macAddress;
    await Model_Device.blockDevice(macAddress);
    req.flash('success', 'Perangkat berhasil diblokir');
    res.redirect('/admin/dashboard');
  } catch (error) {
    req.flash('error', 'Terjadi kesalahan saat memblokir perangkat');
    res.redirect('/admin/dashboard');
  }
});

router.post('/admin/unblock-device/:macAddress', async (req, res) => {
  try {
    const macAddress = req.params.macAddress;
    await Model_Device.unblockDevice(macAddress);
    req.flash('success', 'Perangkat berhasil diaktifkan kembali');
    res.redirect('/admin/dashboard');
  } catch (error) {
    req.flash('error', 'Terjadi kesalahan saat membuka blokir perangkat');
    res.redirect('/admin/dashboard');
  }
});

module.exports = router;