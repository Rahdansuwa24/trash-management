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
        cb(null, 'public/images');
      } else if (file.fieldname === 'file_video') {
        cb(null, 'public/video');
      } else {
        cb(new Error('Fieldname not recognized'), false); // Error jika field tidak sesuai
      }
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uniqueSuffix = Date.now() + '-' + baseName;
      cb(null, uniqueSuffix + ext); 
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
      req.flash('error','Anda tidak memiliki izin untuk halaman ini !!');
      res.redirect('/login')
    }
  };

const ensureMitra = (req, res, next) => {
  if (req.session.userID && req.session.role_users == 'mitra') {
    return next();
  } else {
    req.flash('error','Anda tidak memiliki izin untuk halaman ini !!');
    res.redirect('/login')
  }
};

const checkAccountStatus = async (req, res, next) => {
  const id = req.session.userID;
  const user = await Model_Users.getId(id);

  if (user && user.status === 'frozen') {
    req.flash('error', 'Akun Anda dibekukan. Silakan hubungi administrator.');
    return res.redirect('/warga');
  }
  next();
};

const checkDeviceStatus = async (req, res, next) => {
  try {
    const mac_address = await new Promise((resolve, reject) => {
      address((err, addrs) => {
        if (err) {
          console.error("Error mendapatkan address:", err);
          req.flash('error', "Gagal mendapatkan alamat MAC");
          return res.redirect('/users/warga/sampah_ilegal');
        }

        resolve(addrs.mac);
      });
    });

    if (!mac_address) {
      req.flash('error', 'Alamat MAC tidak ditemukan');
      return res.redirect('/users/warga/sampah_ilegal');
    }

    const statusDevice = await Model_Device.getStatusByMacAddress(mac_address);

    if (statusDevice === 'blocked') {
      req.flash('error', 'Perangkat anda di blokir, silahkan hubungi administrator untuk membuka blokir');
      return res.redirect('/users/warga/sampah_ilegal');
    }

    req.mac_address = mac_address;
    next();
  } catch (error) {
    console.error("Error di middleware checkDeviceStatus:", error);
    req.flash('error', 'Terjadi kesalahan saat memverifikasi perangkat');
    res.redirect('/users/warga/sampah_ilegal');
  }
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
    res.redirect('/');
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
  let user = await Model_Users.getById(id)
  let Mitra = await Model_Mitra.getByIdUsers(id);
  let tipe = Mitra.jenis_mitra
  req.session.mitraId = Mitra.id_mitra
  let id_mitra = req.session.mitraId
  let data = await Model_Users.getId(req.session.userID)
  let mitra = user.nama_users
  let penjualan = await Model_Sampah_Ilegal.countPenjualan(mitra)
  let pembelian = await Model_Sampah_Ilegal.countPembelian(id_mitra)
  console.log(penjualan)
  console.log('id_mitra: ', req.session.mitraId)
  if(tipe == 'pemerintah'){
    res.render('mitra/pemerintah/index', {
      user,
      penjualan,
      pembelian
    });

  }else{
    res.status(500).json('Anda tidak mempunyai akses ke halaman ini !!')
  }
});


// router.get('/mitra/pemerintah/laporan_masuk/balas_akun', async function(req, res, next) {
//   let data = await Model_Users.getById(req.session.userID)
//   res.render('mitra/pemerintah/balas_akun', {
//     nama_users
//   })
// });

// router.get('/mitra/pemerintah/laporan_masuk/report_akun/:id_laporan_sampah_ilegal', async function(req, res, next) {
//   let data = await Model_Users.getById(req.session.userID)
//   res.render('mitra/pemerintah/report_akun', {
    
//   })
// });

router.get('/mitra/pemerintah/laporan_masuk', ensureMitra, async function(req, res, next) {
  let data = await Model_Users.getById(req.session.userID);
  let row = await Model_Sampah_Ilegal.getAllData();
  console.log('data: ', row);
  console.log('User: ', data);
  res.render('mitra/pemerintah/laporan', {
    users: data,
    rows: row

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
  let dataLaporan = await Model_Mitra.mitraKomersil()
  console.log('data laporan: ',dataLaporan)
  console.log(Array.isArray(dataLaporan));
  if(tipe === 'non-pemerintah'){
    res.render('mitra/non-pemerintah/index', {
      nama_users,
      tipe,
      dataLaporan
    });

  }else{
    res.status(500).json('Anda tidak mempunyai akses ke halaman ini !!')
  }
});

router.get('/mitra/non-pemerintah/lapor/:id_laporan_sampah_komersil', ensureMitra, async function(req, res, next) {
  let id = req.params.id_laporan_sampah_komersil
  let data = await Model_Sampah_Komersil.getDataByIdLpSampahKomersil(id);
  let users = await Model_Users.getById(req.session.userID);
  res.render('mitra/non-pemerintah/lapor',{
    data,
    users
  });
});

router.get('/warga', async function(req, res, next) {
    let data = await Model_Users.getId(req.session.userID)
    let nama_users = data[0].nama_users
    let id_warga = req.session.wargaId
    let penjualan = await Model_Sampah_Komersil.countPenjualan(id_warga)
    let sampah = await Model_Sampah_Komersil.getSampahKomersil();
    let filteredSampah = sampah.filter(item => item.id_warga === id_warga);
    console.log(filteredSampah);
    console.log(id_warga)
    console.log(penjualan)
    
    res.render('users/index', {
      data,
      nama_users,
      sampah: JSON.stringify(filteredSampah),
      id_warga,
      penjualan

    });
});

// router.get('/warga/sell', async function(req, res) {
//   res.render('users/sell', { id_warga: req.session.userID });
// });

router.get('/warga/sell', ensureWarga, async function (req, res, next) {
  const id_warga = req.session.wargaId; // ID warga dari sesi
  const id_users = req.session.userID; // ID user dari sesi
  const kota = req.session.kota; // Ambil data kota dari session
  console.log("Filter kota dari session:", kota);
  let data = await Model_Users.getId(req.session.userID)
  let nama_users = data[0].nama_users
  let sampah = await Model_Sampah_Komersil.getSampahKomersil();
  let penjualan = await Model_Sampah_Komersil.countPenjualan()

  console.log("ID Warga:", id_warga, "ID Users:", id_users);
  console.log("Filter diterima:", { kota});
  console.log(sampah);
  try {
      const dataMitra = await Model_Mitra.joinUsersMitraKomersilTest(kota);
      console.log("Data Mitra:", dataMitra);
      res.render('users/sell', {
          id_warga,
          dataMitra,
          kota,
          nama_users,
          sampah,
          penjualan
      });
  } catch (err) {
      console.error("Error saat mengambil data mitra:", err);
      res.status(500).send("Terjadi kesalahan saat memuat data mitra.");
  }
});

router.get('/warga/get-session-kota', (req, res) => {
  try {
    const kota = req.session.kota || null; 
    console.log("Mengirim kota dari session:", kota);
    res.json({ kota });
  } catch (err) {
    console.error("Error saat mengakses session kota:", err);
    res.status(500).json({ error: "Gagal mengambil data kota dari session." });
  }
});

router.get('/warga/get-mitra', async (req, res) => {
  const kota = req.query.kota;

  if (!kota) {
    console.error("Parameter kota tidak diberikan.");
    return res.status(400).json({ error: "Parameter 'kota' wajib disediakan." });
  }

  try {
    const dataMitra = await Model_Mitra.joinUsersMitraKomersilTest(kota);

    if (dataMitra.length === 0) {
      console.log(`Tidak ada mitra yang tersedia untuk kota: ${kota}`);
      return res.json([]);
    }

    console.log(`Ditemukan ${dataMitra.length} mitra untuk kota: ${kota}`);
    res.json(dataMitra);
  } catch (err) {
    console.error("Error saat mengambil data mitra:", err);
    res.status(500).json({ error: "Terjadi kesalahan saat memuat data mitra." });
  }
});

router.get('/warga/get-mitra-ilegal', async (req, res) => {
  const kota = req.query.kota;

  if (!kota) {
    console.error("Parameter kota tidak diberikan.");
    return res.status(400).json({ error: "Parameter 'kota' wajib disediakan." });
  }

  try {
    const dataMitra = await Model_Mitra.joinUsersMitraIlegal(kota);

    if (dataMitra.length === 0) {
      console.log(`Tidak ada mitra yang tersedia untuk kota: ${kota}`);
      return res.json([]);
    }

    console.log(`Ditemukan ${dataMitra.length} mitra untuk kota: ${kota}`);
    res.json(dataMitra);
  } catch (err) {
    console.error("Error saat mengambil data mitra:", err);
    res.status(500).json({ error: "Terjadi kesalahan saat memuat data mitra." });
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

    if (kota) {
      req.session.kota = kota; 
    }


    let Data = {
      id_warga,
      jenis_sampah,
      file_foto: file_foto ? file_foto[0].filename: null,
      file_video: file_video ? file_video[0].filename: null,
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

 router.get('/warga/sell/sampah_komersil/delete', ensureWarga, async function(req, res, next) {
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

// router.get('/warga/kotak_balasan', async function(req,res,next){
//   let data = await Model_Users.getById(req.session.userID);
//   let balasan = await Model_Warga.getAllDataBalasan()
//   res.render('users/kotak_balasan', {
//     users: data,
//     rows: balasan
//   })
// });

router.get('/warga/sampah_ilegal', async function(req, res, next) {
  const kota = req.session.kota;
  let dataMitra = await Model_Mitra.joinUsersMitraIlegal(kota)
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

router.post('/warga/sampah_ilegal/submit', checkDeviceStatus, function(req, res, next) {
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
      let { provinsi, kota, kelurahan, kecamatan, lokasi, mitra, nomor_hp, latitude, longitude, alamat } = req.body;


      if (!file_foto && !file_video) {
        req.flash('error', "File foto atau video wajib diunggah.");
        return res.redirect('/users/warga/sampah_ilegal');
      }

      let Data = {
        mac_address,
        file_foto: file_foto ? file_foto[0].filename : null,
        file_video: file_video ? file_video[0].filename : null,
        provinsi,
        kota,
        kelurahan,
        kecamatan,
        lokasi,
        mitra,
        latitude,
        longitude,
        alamat,
        nomor_hp
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


router.get('/mitra/pemerintah/laporan_masuk/balas_akun/:id_laporan_sampah_ilegal', ensureMitra, async function(req, res, next) {
  let id_lp = req.params.id_laporan_sampah_ilegal;
  let id = req.session.userID;
  let user = await Model_Users.getById(id);
  let mitra = await Model_Mitra.getByIdUsers(id);
  let data = await Model_Sampah_Ilegal.getIdLpIlegal(id_lp);
  res.render('mitra/pemerintah/balas_akun', {
    data,
    users: user,
    mitra
  })
});

router.get('/mitra/pemerintah/laporan_masuk/report_akun/:id_laporan_sampah_ilegal', ensureMitra, async function(req, res, next) {
  let id_lp = req.params.id_laporan_sampah_ilegal;
  let id = req.session.userID;
  let user = await Model_Users.getById(id);
  console.log('user: ', user);
  let data = await Model_Sampah_Ilegal.getIdLpIlegal(id_lp); 
  res.render('mitra/pemerintah/report_akun',{
    data,
    users: user
  })
});

router.post('/mitra/pemerintah/laporan_masuk/report_akun/submit', async function(req, res, next) {
  uploadFields(req, res, async function (err) {
    if (err) {
      console.error("Error saat upload:", err.message);
      req.flash('error', err.message);  
      return res.redirect('/pemerintah/laporan_masuk/report_akun/');
    }
    let file_foto = req.files['file_foto'];
    let file_video = req.files['file_video'];
    let { judul_lapor_akun, deskripsi_lapor_akun, id_laporan_sampah_ilegal, } = req.body
    let data = {
      judul_lapor_akun,
      deskripsi_lapor_akun,
      file_foto: file_foto ? file_foto[0].filename: null,
      file_video: file_video ? file_video[0].filename: null,
      id_laporan_sampah_ilegal
    }
    try {

      await Model_Device.laporAkunIlegal(data);
      req.flash('success','Berhasil melaporkan akun');
      res.redirect('/users/mitra/pemerintah/laporan_masuk');

    } catch (error) {
      req.flash('error','Terjadi kesalahan pada fungsi');
      res.redirect('/users/mitra/pemerintah/laporan_masuk')
    }
  })
});

router.post('/mitra/pemerintah/laporan_masuk/balas_akun/submit', async function(req, res, next) {
  uploadFields(req, res, async function (err) {
    if (err) {
      console.error("Error saat upload:", err.message);
      req.flash('error', err.message);  
      return res.redirect('/pemerintah/laporan_masuk/');
    }
    let file_foto = req.files['file_foto'];
    let file_video = req.files['file_video'];
    let { deskripsi_balasan, id_laporan_sampah_ilegal, id_mitra } = req.body
    let data = {
      deskripsi_balasan,
      file_foto: file_foto ? file_foto[0].filename: null,
      file_video: file_video ? file_video[0].filename: null,
      id_laporan_sampah_ilegal, 
      id_mitra
    }
    try {

      await Model_Mitra.BalasLaporanIlegal(data);
      req.flash('success','Berhasil membalas laporan');
      res.redirect('/users/mitra/pemerintah/laporan_masuk');

    } catch (error) {
      req.flash('error','Terjadi kesalahan pada fungsi');
      res.redirect('/users/mitra/pemerintah/laporan_masuk')
    }
  })
});

router.get('/mitra/pemerintah/laporan_masuk/tolak/:id_laporan_sampah_ilegal', ensureMitra, async function(req, res, next) {
  try {
    let id = req.params.id_laporan_sampah_ilegal;
    await Model_Sampah_Ilegal.Delete(id);
    req.flash('success','Laporan berhasil ditolak');
    res.redirect('/users/mitra/pemerintah/laporan_masuk');
    
  } catch (error) {
    req.flash('error','Terjadi kesalahan pada fungsi');
    res.redirect('/users/mitra/pemerintah/laporan_masuk');
  }
});

router.post('/mitra/non-pemerintah/laporan_akun', async(req, res, next) => {
  uploadFields(req, res, async function (err) {
    if (err) {
      console.error("Error saat upload:", err.message);
      req.flash('error', err.message);  
      return res.redirect('/users/mitra/non-pemerintah');
    }
    let file_foto = req.files['file_foto'];
    let file_video = req.files['file_video'];
    let { judul_lapor_akun, deskripsi_lapor_akun, id_laporan_sampah_komersil } = req.body
    let data = {
      judul_lapor_akun,
      deskripsi_lapor_akun,
      file_foto: file_foto ? file_foto[0].filename: null,
      file_video: file_video ? file_video[0].filename: null,
      id_laporan_sampah_komersil
    }
    try {

      await Model_Mitra.laporAkunKomersil(data);
      req.flash('success','Berhasil melaporkan akun');
      res.redirect('/users/mitra/non-pemerintah');

    } catch (error) {
      req.flash('error','Terjadi kesalahan pada fungsi');
      res.redirect('/users/mitra/non-pemerintah')
    }
  })
})
module.exports = router;