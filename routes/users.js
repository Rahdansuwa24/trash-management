var express = require('express');
var router = express.Router();
const { address } = require('address');
const Model_Users = require('../Model/Model_Users');
const Model_Device = require('../Model/Model_Device');
const Model_Warga = require('../Model/Model_Warga');
const Model_Mitra = require('../Model/Model_Mitra')
const Model_Sampah_Komersil = require('../Model/Model_Sampah_Komersil')
const multer  = require('multer')
const path = require('path');
const fs = require('fs')

const storageImage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images')
  },
  filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uniqueSuffix = Date.now() + '-' + baseName;
      cb(null, uniqueSuffix + ext);
  }
})
const storageVideo = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/video')
  },
  filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uniqueSuffix = Date.now() + '-' + baseName;
      cb(null, uniqueSuffix + ext);
  }
})

const upload = multer({
  storage: function (req, file, cb) {
    if (file.fieldname === 'file_foto') {
      cb(null, storageImage);
    } else if (file.fieldname === 'file_video') {
      cb(null, storageVideo);
    }
  }
});

const uploadFields = upload.fields([
  { name: 'file_foto', maxCount: 1 },
  { name: 'file_video', maxCount: 1 }
]);

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
    const { jenis_kelamin, no_telp, alamat, provinsi, kota, kelurahan, kecamatan } = req.body;
    let poin = 0
    const dataWarga = {
      id_users: req.session.userID,
      jenis_kelamin,
      no_telp,
      alamat,
      provinsi, 
      kota, 
      kelurahan, 
      kecamatan,
      poin

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
      const { jenis_mitra, no_telp, alamat, provinsi, kota, kelurahan, kecamatan } = req.body;
      
      const Data = {
        id_users: req.session.userID,
        jenis_mitra,
        no_telp,
        alamat,
        provinsi, 
        kota, 
        kelurahan, 
        kecamatan
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

router.get('/mitra/pemerintah', ensureMitra, async function(req, res, next) {

  let id = req.session.userID
  let Mitra = await Model_Mitra.getByIdUsers(id);
  let tipe = Mitra.jenis_mitra

  if(tipe == 'pemerintah'){
    res.render('mitra/pemerintah/index');//kuubah
  }else{
    res.status(500).json('Anda tidak mempunyai akses ke halaman ini !!')
  }
});

router.get('/mitra/pemerintah/laporan_masuk/balas_akun', function(req, res, next) {
  res.render('mitra/pemerintah/balas_akun')
});

router.get('/mitra/pemerintah/laporan_masuk/report_akun', function(req, res, next) {
  res.render('mitra/pemerintah/report_akun')
});

router.get('/mitra/pemerintah/laporan_masuk', function(req, res, next) {
  res.render('mitra/pemerintah/laporan');
});

router.get('/mitra/non-pemerintah', ensureMitra, async function(req, res, next) {
  console.log('role: ', req.session.role_users);
  console.log('ID: ', req.session.userID);

  let id = req.session.userID
  let Mitra = await Model_Mitra.getByIdUsers(id);
  let tipe = Mitra.jenis_mitra
  if(tipe == 'non-pemerintah'){
    res.render('mitra/non-pemerintah/index');

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
  let id_warga = req.session.userID
  console.log(id_warga)
  address((err, addrs) => {
    console.log(addrs.ip, addrs.ipv6, addrs.mac);
  });
  res.render('users/create');
});

router.post('/warga/sell/sampah/submit', uploadFields, async function(req, res, next) {
 let id_warga = req.session.userID
 let file_foto = req.files['file_foto']
 let file_video = req.files['file_video']
 let {deskripsi_laporan, jenis_sampah, provinsi, kota, kelurahan, kecamatan} = req.body

 let Data = {id_warga, deskripsi_laporan, jenis_sampah, lokasi, file_foto, file_video, provinsi, kota, kelurahan, kecamatan}

 await Model_Sampah_Komersil.Store(Data)
 res.redirect('/warga/sell/create')
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

 router.get('/warga/sell/sampah_komersil/delete', async function(req, res, next) {
  let id_warga = req.session.userID
  console.log(id_warga)
  let dataSampahKomersil = await Model_Sampah_Komersil.getId(id_warga)
  let fileOldImage = dataSampahKomersil[0].file_foto
  let fileOldVideo = dataSampahKomersil[0].file_video
    if(fileOldImage){
        const pathFile = path.join(__dirname, '../public/images', fileOldImage)
        fs.unlink(pathFile, (err) => {
            if (err) {
                console.error("Gagal menghapus file lama:", err);
            } else {
                console.log("File lama berhasil dihapus:", fileOldImage);
            }
        });
    }
    if(fileOldVideo){
        const pathFile = path.join(__dirname, '../public/video', fileOldVideo)
        fs.unlink(pathFile, (err) => {
            if (err) {
                console.error("Gagal menghapus file lama:", err);
            } else {
                console.log("File lama berhasil dihapus:", fileOldVideo);
            }
        });
    }
    await Model_Sampah_Komersil.Delete(Data)
    res.redirect('/warga/sell/create')
});


router.get('/warga/sampah_ilegal', function(req, res, next) {
  res.render('users/ilegal')
});

router.post('/warga/sampah_ilegal/submit', async function(req, res, next) {

  let mac_address
  let {deskripsi_laporan, lokasi, file_foto, file_video, status_device} = req.body

  let Data = {deskripsi_laporan, lokasi, file_foto, file_video, status_device}
 
  await Model_Sampah_Komersil.store(Data)
});

router.get('/warga/sampah_ilegal/edit', function(req, res, next) {
  res.render('users/ilegal')
});

router.post('/warga/sampah_ilegal/update', async function(req, res, next) {

  let mac_address
  let {deskripsi_laporan, lokasi, file_foto, file_video, status_device} = req.body

  let Data = {deskripsi_laporan, lokasi, file_foto, file_video, status_device}
 
  await Model_Sampah_Komersil.store(Data)
});

router.get('/warga/sampah_ilegal/delete', function(req, res, next) {
  res.render('users/ilegal')
});


module.exports = router;
