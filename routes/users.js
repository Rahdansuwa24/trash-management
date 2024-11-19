var express = require('express');
var router = express.Router();
const { address } = require('address');
const Model_Users = require('../Model/Model_Users');
const Model_Device = require('../Model/Model_Device');
const Model_Warga = require('../Model/Model_Warga');
const Model_Mitra = require('../Model/Model_Mitra')
const Model_Sampah_Komersil = require('../Model/Model_Sampah_Komersil')
const Model_Sampah_Ilegal = require('../Model/Model_Sampah_Ilegal')
const multer  = require('multer')
const path = require('path');
const fs = require('fs')

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'file_foto') {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
      cb(null, true); 
    } else {
      req.flash('error', 'Hanya file gambar (jpg, jpeg, png) yang diperbolehkan untuk file foto!');
      cb(null, false); 
    }
  } else if (file.fieldname === 'file_video') {
    if (file.mimetype === 'video/mp4' || file.mimetype === 'video/x-msvideo') {
      cb(null, true); 
    } else {
      req.flash('error', 'Hanya file video (mp4, avi) yang diperbolehkan untuk file video!');
      cb(null, false);  
    }
  } else {
    req.flash('error', 'Fieldname tidak dikenali!');
    cb(null, false);
  }
};


const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === 'file_foto') {
        cb(null, 'public/images'); // Folder untuk gambar
      } else if (file.fieldname === 'file_video') {
        cb(null, 'public/video'); // Folder untuk video
      } else {
        cb(new Error('Fieldname not recognized'), false); // Error jika field tidak sesuai
      }
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uniqueSuffix = Date.now() + '-' + baseName;
      cb(null, uniqueSuffix + ext); // Nama file unik
    },
  }),
  fileFilter: fileFilter
});

const uploadFields = upload.fields([
  { name: 'file_foto', maxCount: 2 },
  { name: 'file_video', maxCount: 2 }
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
        res.redirect('/users/mitra/pemerintah');
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

router.get('/', async function(req, res, next) {
  if(!req.session.userID){
    req.flash('warning', 'anda harus login')
    return res.redirect('/login')
  }
  let id = req.session.userID
  console.log(id)
  let Data = await Model_Users.getId(id)
  let dataWarga = await Model_Warga.getByIdUsers(id)

  console.log(dataWarga)

  if (Data[0].id_users === dataWarga.id_users) {
    req.session.wargaId = dataWarga.id_warga
    console.log(req.session.wargaId)
    res.redirect(`/users/warga`)
  } else {
    req.flash('error', 'Data warga tidak ditemukan');
    return res.redirect('/login');  
  }
});


router.get('/mitra/pemerintah', ensureMitra, async function(req, res, next) {

  let id = req.session.userID
  let Mitra = await Model_Mitra.getByIdUsers(id);
  let tipe = Mitra.jenis_mitra
  req.session.mitraId = Mitra.id_mitra
  let data = await Model_Users.getId(req.session.userID)
  let nama_users = data[0].nama_users
  console.log('id_mitra: ', req.session.mitraId)
  if(tipe == 'pemerintah'){
    res.render('mitra/pemerintah/index', {
      nama_users
    });//kuubah
  }else{
    res.status(500).json('Anda tidak mempunyai akses ke halaman ini !!')
  }
});

router.get('/mitra/pemerintah/laporan_masuk/balas_akun', async function(req, res, next) {
  let data = await Model_Users.getId(req.session.userID)
  let nama_users = data[0].nama_users
  res.render('mitra/pemerintah/balas_akun', {
    nama_users
  })
});

router.get('/mitra/pemerintah/laporan_masuk/report_akun', async function(req, res, next) {
  let data = await Model_Users.getId(req.session.userID)
  let nama_users = data[0].nama_users
  res.render('mitra/pemerintah/report_akun', {
    nama_users
  })
});

router.get('/mitra/pemerintah/laporan_masuk', async function(req, res, next) {
  let data = await Model_Users.getId(req.session.userID)
  let nama_users = data[0].nama_users
  res.render('mitra/pemerintah/laporan', {
    nama_users
  });
});

router.get('/mitra/non-pemerintah', ensureMitra, async function(req, res, next) {
  console.log('role: ', req.session.role_users);
  console.log('ID: ', req.session.userID);

  let id = req.session.userID
  let Mitra = await Model_Mitra.getByIdUsers(id);
  let data = await Model_Users.getId(req.session.userID)
  let nama_users = data[0].nama_users
  let tipe = Mitra.jenis_mitra
  req.session.mitraId = Mitra.id_mitra
  console.log('id_mitra: ', req.session.mitraId)
  if(tipe == 'non-pemerintah'){
    res.render('mitra/non-pemerintah/index', {
      nama_users
    });

  }else{
    res.status(500).json('Anda tidak mempunyai akses ke halaman ini !!')
  }
});

router.get('/mitra/non-pemerintah/lapor', function(req, res, next) {
  res.render('mitra/non-pemerintah/lapor');
});

router.get('/warga', async function(req, res, next) {
    let data = await Model_Users.getId(req.session.userID)
    let nama_users = data[0].nama_users
    res.render('users/index', {
      nama_users
    });
});

// router.get('/warga/sell', async function(req, res) {
//   res.render('users/sell', { id_warga: req.session.userID });
// });

router.get('/warga/sell', async function (req, res, next) {
  const id_warga = req.session.wargaId; // ID warga dari sesi
  const id_users = req.session.userID; // ID user dari sesi
  const { kota, kecamatan } = req.query; // Ambil filter dari query string
  let data = await Model_Users.getId(req.session.userID)
  let nama_users = data[0].nama_users

  console.log("ID Warga:", id_warga, "ID Users:", id_users);
  console.log("Filter diterima:", { kota, kecamatan });

  try {
      const dataMitra = await Model_Mitra.joinUsersMitra(kota, kecamatan);
      console.log("Data Mitra:", dataMitra);
      res.render('users/sell', {
          id_warga,
          dataMitra,
          kota,
          kecamatan,
          nama_users
      });
  } catch (err) {
      console.error("Error saat mengambil data mitra:", err);
      res.status(500).send("Terjadi kesalahan saat memuat data mitra.");
  }
});



router.post('/warga/sell/sampah/submit', function(req, res, next) {
  uploadFields(req, res, async function (err) {
    if (err) {
      console.error("Error saat upload:", err.message);
      req.flash('error', err.message);  
      return res.redirect('/users/warga/sell');
    }

    let id_warga = req.session.wargaId;
    let file_foto = req.files['file_foto'];
    let file_video = req.files['file_video'];
    let { jenis_sampah, provinsi, kota, kelurahan, kecamatan, latitude, longitude, mitra } = req.body;

    if (!file_foto && !file_video) {
      req.flash('error', "File foto atau video wajib diunggah.");
      return res.redirect('/users/warga/sell');
    }

    let Data = {
      id_warga,
      jenis_sampah,
      file_foto: file_foto ? file_foto[0].path : null,
      file_video: file_video ? file_video[0].path : null,
      provinsi,
      kota,
      kelurahan,
      kecamatan,
      latitude,
      longitude,
      mitra
    };

    try {
      await Model_Sampah_Komersil.Store(Data);
      req.flash('success', 'Data sampah berhasil disimpan!');
      res.redirect('/users/warga/sell'); 
    } catch (storeError) {
      console.error("Gagal menyimpan data sampah:", storeError);
      req.flash('error', 'Gagal menyimpan data sampah.');
      res.redirect('/users/warga/sell'); 
    }
  });
});

// router.post('/warga/sell/sampah/submit', uploadFields, async function(req, res, next) {
//  let id_warga = req.session.userID
//  let file_foto = req.files['file_foto']
//  let file_video = req.files['file_video']
//  let {deskripsi_laporan, jenis_sampah, provinsi, kota, kelurahan, kecamatan} = req.body

//  let Data = {id_warga, deskripsi_laporan, jenis_sampah, lokasi, file_foto, file_video, provinsi, kota, kelurahan, kecamatan}

//  await Model_Sampah_Komersil.Store(Data)
//  res.redirect('/warga/sell')
// });

// router.get('/warga/sell/sampah_komersil/edit', function(req, res, next) {
//   res.render('users/sell');
// });

// router.post('/warga/sell/sampah_komersil/update', async function(req, res, next) {
//   let id_warga = req.session.id_warga
//   let {deskripsi_laporan, jenis_sampah, file_foto, file_video, lokasi} = req.body
 
//   let Data = {id_warga, deskripsi_laporan, jenis_sampah, file_foto, file_video, lokasi}
 
//   await Model_Sampah_Komersil.store(Data)
//  });

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
    res.redirect('/warga/sell')
});

router.get('/warga/kotak_balasan', async function(req,res,next){
  let data = await Model_Users.getId(req.session.userID)
  let nama_users = data[0].nama_users
  res.render('users/kotak_balasan', {
    nama_users
  })
});

router.get('/warga/sampah_ilegal', async function(req, res, next) {
  let dataMitra = await Model_Mitra.joinUsersMitraIlegal()
  // address((err, addrs) => {
  //   if (err) {
  //     console.error("Error mendapatkan address:", err);
  //   } else {
  //     let mac_address = addrs.mac;
  //   }
  // });
  res.render('users/ilegal', {
    dataMitra
  })
});

router.post('/warga/sampah_ilegal/submit', function(req, res, next) {
  uploadFields(req, res, async function (err) {
    if (err) {
      console.error("Error saat upload:", err.message);
      req.flash('error', err.message);  
      return res.redirect('/users/warga/sampah_ilegal');  
    }

    address(async (err, addrs) => {
      if (err) {
        console.error("Error mendapatkan address:", err);
        req.flash('error', "Gagal mendapatkan alamat MAC");
        return res.redirect('/users/warga/sampah_ilegal');
      }

      let mac_address = addrs.mac;
      let file_foto = req.files['file_foto'];
      let file_video = req.files['file_video'];
      let { provinsi, kota, kelurahan, kecamatan, lokasi, mitra } = req.body;

      if (!file_foto && !file_video) {
        req.flash('error', "File foto atau video wajib diunggah.");
        return res.redirect('/users/warga/sampah_ilegal');
      }

      let Data = {
        mac_address,
        file_foto: file_foto ? file_foto[0].path : null,
        file_video: file_video ? file_video[0].path : null,
        provinsi,
        kota,
        kelurahan,
        kecamatan,
        lokasi,
        mitra,
      };

      try {
        await Model_Sampah_Ilegal.Store(Data);
        req.flash('success', 'Data sampah ilegal berhasil disimpan!');
        res.redirect('/users/warga/sampah_ilegal');
      } catch (storeError) {
        console.error("Gagal menyimpan data:", storeError);
        req.flash('error', 'Gagal menyimpan data sampah ilegal.');
        res.redirect('/users/warga/sampah_ilegal');
      }
    });
  });
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

router.get('/mitra/pemerintah/laporan_masuk/balas_akun', function(req, res, next) {
  res.render('mitra/pemerintah/balas_akun')
});
router.get('/mitra/pemerintah/laporan_masuk/report_akun', function(req, res, next) {
  res.render('mitra/pemerintah/report_akun')
});
module.exports = router;