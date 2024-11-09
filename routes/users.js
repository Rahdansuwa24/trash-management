var express = require('express');
var router = express.Router();
const Model_Users = require('../Model/Model_Users');
const Model_Device = require('../Model/Model_Device');
const Model_Warga = require('../Model/Model_Warga');
const Model_Mitra = require('../Model/Model_Mitra')

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

router.get('/warga/complete-profile-warga', ensureWarga, async(req, res, next) => {
  res.render('auth/complete-profile-warga');
})

router.post('/warga/save-profile', async(req, res) => {
  try {
    const { jenis_kelamin, no_telp, alamat } = req.body;
    const dataWarga = {
      id_users: req.session.userID,
      jenis_kelamin,
      no_telp,
      alamat
    }  
    await Model_Warga.Store(dataWarga);
    req.flash('success', 'Data akun berhasil disimpan');
    res.redirect('/users/warga');      
  } catch (error) {
    req.flash('error', 'Terjadi kesalahan pada fungsi');
    res.redirect('/users/warga');
  }
})

router.get('/mitra/complete-profile-mitra', ensureMitra, async(req, res, next) => {
  res.render('auth/complete-profile-mitra');
})

router.post('/mitra/save-profile', async(req, res) => {
try {
      const { jenis_mitra, no_telp, alamat } = req.body;
      
      const Data = {
        id_users: req.session.userID,
        jenis_mitra,
        no_telp,
        alamat
      }
      
      await Model_Mitra.Store(Data);
      req.flash('success', 'Data akun berhasil disimpan');

      if(jenis_mitra == 'pemerintah'){
        res.redirect('/users/mitra');
      }else if(jenis_mitra == 'non-pemerintah'){
        res.redirect('/users/mitra/non-pemerintah');
      }else{
        res.status(500).json('Data akun tidak ada !!');
      }
      
    } catch (error) {
      req.flash('error', 'Terjadi kesalahan pada fungsi');
      res.redirect('/create-data-warga');
    }
});

router.get('/mitra', ensureMitra, async function(req, res, next) {

  let id = req.session.userID
  let Mitra = await Model_Mitra.getByIdUsers(id);
  let tipe = Mitra.jenis_mitra

  if(tipe == 'pemerintah'){
    res.render('mitra/index');
  }else{
    res.status(500).json('Anda tidak mempunyai akses ke halaman ini !!')
  }
});

router.get('/mitra/non-pemerintah', ensureMitra, async function(req, res, next) {
  console.log('role: ', req.session.role_users);
  console.log('ID: ', req.session.userID);

  let id = req.session.userID
  let Mitra = await Model_Mitra.getByIdUsers(id);
  let tipe = Mitra.jenis_mitra
  if(tipe == 'non-pemerintah'){
    res.render('mitra/index-swasta');

  }else{
    res.status(500).json('Anda tidak mempunyai akses ke halaman ini !!')
  }
});

router.get('/warga', function(req, res, next) {
    res.render('users/index');
});

router.get('/warga/sell', function(req, res, next) {
    res.render('users/sell');
});

router.get('/warga/sell/create', function(req, res, next) {
  res.render('users/create');
});

router.post('/warga/sell/sampah_komersil/submit', async function(req, res, next) {
 let id_warga = req.session.id_warga
 let {deskripsi_laporan, jenis_sampah, file_foto, file_video, lokasi} = req.body

 let Data = {id_warga, deskripsi_laporan, jenis_sampah, file_foto, file_video, lokasi}

 await Model_Sampah_Komersil.store(Data)
});

router.get('/warga/sell/sampah_komersil/edit', function(req, res, next) {
  res.render('users/create');
});

router.post('/warga/sell/sampah_komersil/update', async function(req, res, next) {
  let id_warga = req.session.id_warga
  let {deskripsi_laporan, jenis_sampah, file_foto, file_video, lokasi} = req.body
 
  let Data = {id_warga, deskripsi_laporan, jenis_sampah, file_foto, file_video, lokasi}
 
  await Model_Sampah_Komersil.store(Data)
 });

router.get('/warga/sell/sampah_ilegal', function(req, res, next) {
  res.render('users/create')
});

router.post('/warga/sell/sampah_ilegal/submit', async function(req, res, next) {

  let mac_address
  let {deskripsi_laporan, lokasi, file_foto, file_video, status_device} = req.body

  let Data = {deskripsi_laporan, lokasi, file_foto, file_video, status_device}
 
  await Model_Sampah_Komersil.store(Data)
});

router.get('/warga/sell/sampah_ilegal/edit', function(req, res, next) {
  res.render('users/create')
});

router.post('/warga/sell/sampah_ilegal/update', async function(req, res, next) {

  let mac_address
  let {deskripsi_laporan, lokasi, file_foto, file_video, status_device} = req.body

  let Data = {deskripsi_laporan, lokasi, file_foto, file_video, status_device}
 
  await Model_Sampah_Komersil.store(Data)
});

router.get('/warga/sell/sampah_ilegal/delete', function(req, res, next) {
  res.render('users/create')
});


module.exports = router;
