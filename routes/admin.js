var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
const Model_Warga = require('../Model/Model_Warga');
const Model_Users = require('../Model/Model_Users');
const Model_Device = require('../Model/Model_Device');
const Model_Mitra = require('../Model/Model_Mitra');
const Model_Admin = require('../Model/Model_Admin');

const ensureAuthenticated = (req, res, next) => {
    if (req.session.userID && req.session.role_users == 'admin') {
      return next();
    } else {
      req.flash('error','Anda tida memiliki izin untuk halaman ini !!');
      res.redirect('/login')
    }
  };

router.get('/', async(req, res, next) =>{
    let Data = await Model_Users.getAll();
        res.render('admin/index', {
          title: 'Data Users',
          rows: Data
        });
})

router.get('/data-user', ensureAuthenticated, async(req, res, next) =>{
    let id = req.session.userID;
    let User = await Model_Admin.getAdminLogin(id);
    console.log('User login: ', User);
    let Data = await Model_Users.getAll();
    res.render('admin/home', {
        title: 'Data Warga',
        rows: Data,
        Users: User
    })
});


router.get('/delete-users/:id', ensureAuthenticated, async (req, res, next) => {
  try {
    const id = req.params.id;
    await Model_Users.Delete(id);
    
    req.flash('success','Berhasil Menghapus User');
    res.redirect('/admin/dashboard');
  } catch (error) {
    req.flash('error','Terjadi kesalahan pada fungsi');
      res.redirect('/admin/dashboard')
    }
  });
  
  router.get('/laporan-akun-komersil', ensureAuthenticated, async (req, res, next)=> {
    let id = req.session.userID;
    let User = await Model_Admin.getAdminLogin(id);
    let data = await Model_Admin.getLaporanAkunKomersil();
    res.render('admin/laporan-komersil',{
      rows: data,
      Users: User
    }
  )
});

  router.get('/laporan-akun-ilegal', ensureAuthenticated, async (req, res, next)=> {
    let id = req.session.userID;
    let User = await Model_Admin.getAdminLogin(id);
    let data = await Model_Admin.getLaporanIlegal();
    console.log('Data cihuy: ', data)
    res.render('admin/laporan-ilegal',{
      rows: data,
      Users: User
    }
  )
});

router.get('/delete-warga/:id', ensureAuthenticated, async(req, res) => {
  try {
    const id = req.params.id;
    await Model_Warga.Delete(id);

    req.flash('success','Berhasil menghapus data warga');
    res.redirect('/admin/data-warga');
  } catch (error) {
    req.flash('error','Terjadi kesalahan pada fungsi');
    res.redirect('/admin/data-warga');
  }
})

router.get('/delete-mitra/:id', ensureAuthenticated, async(req, res) => {
  try {
    let id = req.params.id;
    await Model_Mitra.Delete(id);

    req.flash('success','Berhasil menghapus data mitra');
    res.redirect('/admin/data-mitra');
  } catch (error) {
    req.flash('error','Terjadi kesalahan pada fungsi');
    res.redirect('/admin/data-mitra');
  }
})

// router.get('/create-user', ensureAuthenticated, async(req, res, next) =>{
//     res.render('admin/form-create-akun')
// })

// router.post('/store-user', async(req, res, next) => {
//   try {
//     let {nama_users, email, password, role_users} = req.body;
//     let enkripsi = await bcrypt.hash(password, 10);
//     let Data = { 
//       nama: nama_users,
//       email,
//       password: enkripsi,
//       role_users
//     }

//     await Model_Users.Store(Data);

//     req.flash('success', 'Berhasil Register akun');
//     res.redirect('/admin/data-users')
//   } catch (error) {
//     req.flash('error', 'Gagal membuat akun');
//     console.error('Error:', error);
//     res.redirect('/admin/dashboard'); 
//     next(error);
//   }
// });

// CRUD Warga
// router.get('/create-warga', ensureAuthenticated, async(req, res,) => {
//   res.render('admin/create-data-warga');
// })

// router.post('/store-warga', async(req, res, next) => {
//   try {
//     let user = await Model_Users.getAll();
//     let { id_users, jenis_kelamin, no_telp, alamat } = req.body;
//     let Data = {
//       user,
//       id_users,
//       jenis_kelamin,
//       no_telp,
//       alamat
//     }
//     await Model_Warga.Store(Data);
    
//     req.flash('success','Berhasil menambahkan warga');
//     res.redirect('/admin/data-warga')

//   } catch (error) {
//     req.flash('error','Terjadi kesalahan pada fungsi');
//     res.redirect('/admin/data-warga')
//   }
// });

// router.get('/edit-warga/:id', ensureAuthenticated, async(req, res, next) => {
//   let id = req.params.id;
//   let data = await Model_Users.getAll();
//   let rows = await Model_Warga.getId(id)
//   res.render('admin/edit-warga', {
//     id_warga: rows[0].id_warga,
//     id_users: rows[0].id_users,
//     jenis_kelamin: rows[0].jenis_kelamin,
//     no_telp: rows[0].no_telp,
//     alamat: rows[0].alamat,
//     data
//   })
// });

// router.post('/update-warga/:id', async(req, res, next) => {
//   try {
//     let id = req.params.id
//     let { id_users, jenis_kelamin, no_telp, alamat } = req.body;
//     let Data = { id_users, jenis_kelamin, no_telp, alamat}

//     await Model_Warga.Update(id, Data);
//     req.flash('success','Berhasil merubah data warga');
//     res.redirect('/admin/data-warga')
//   } catch (error) {
//     req.flash('error','terjadi kesalahan pada fungsi');
//     res.redirect('/admin/data-warga');
//   }
// });


// End Point CRUD Warga


// CRUD mitra
// router.get('/create-mitra', ensureAuthenticated, async(req, res) => {
//   let data = await Model_Users.getAll()
//   res.render('admin/data-mitra', {
//     title: 'Data Mitra',
//     data: rows
//   })
// });

// router.post('/store-mitra', async(req, res) => {
//   try {
//     let { id_users, jenis_mitra, no_telp, alamat} = req.body;
//     let data = {
//       id_users,
//       jenis_mitra,
//       no_telp,
//       alamat
//     }
//     await Model_Mitra.Store(data);
//     req.flash('success','Berhasil menambah mitra');
//     res.redirect('/admin/data-mitra');
//   } catch (error) {
//     req.flash('error','Terjadi kesalahan pada fungsi');
//     res.redirect('/admin/data-mitra')
//   }
// });

// router.get('/edit-mitra/:id', ensureAuthenticated, async(req, res) => {
//   let id = req.params.id;
//   let rows = await Model_Mitra.getId(id);
//   let data = await Model_Users.getAll();
//   res.render('admin/edit-mitra', {
//     id_mitra: rows[0].id_mitra,
//     id_users: rows[0].id_users,
//     jenis_mitra: rows[0].jenis_mitra,
//     no_telp: rows[0].no_telp,
//     alamat: rows[0].alamat,
//     data
//   })
// })

// router.post('/update-mitra/:id', async(req, res) => {
//   try {
//     let id = req.params.id;
//     let { id_users, jenis_mitra, no_telp, alamat } = req.body;
//     let Data = { id_users, jenis_mitra, no_telp, alamat}

//     await Model_Mitra.Update(id, Data);
//     req.flash('success','Berhasil merubah mitra');
//     res.redirect('/admin/data-mitra')
//   } catch (error) {
//     req.flash('error','Terjadi kesalahan pada fungsi');
//     res.redirect('/admin/data-mitra');
//   }
// })



// End Point CRUD Mitra

router.get('/freeze-account/:id', async(req, res, next)=>{
  try {
    const id = req.params.id;
    await Model_Admin.freezeAcc(id);
    req.flash('success','Berhasil Membekukan Akun');
    res.redirect('/admin/data-user')
  } catch (error) {
    req.flash('error','Terjadi kesalahan pada fungsi');
    res.redirect('/admin/dashboard')
  }
});

router.get('/activate-account/:id', async(req, res, next)=>{
  try {
    const id = req.params.id;
    await Model_Admin.ActivateAcc(id);
    console.log('IDD : ', id);
    req.flash('success','Berhasil Membuka pembekuan Akun');
    res.redirect('/admin/data-user')
  } catch (error) {
    req.flash('error','Terjadi kesalahan pada fungsi');
    res.redirect('/admin/dashboard')
  }
});

router.get('/block-device/:macAddress', async (req, res) => {
  try {
    const macAddress = req.params.macAddress;
    console.log('Mac Adress: ', macAddress);
    await Model_Device.blockDevice(macAddress);
    req.flash('success', 'Perangkat berhasil diblokir');
    res.redirect('/admin/laporan-akun-ilegal');
  } catch (error) {
    req.flash('error', 'Terjadi kesalahan saat memblokir perangkat');
    res.redirect('/admin/data-user');
  }
});

router.get('/unblock-device/:macAddress', async (req, res) => {
  try {
    const macAddress = req.params.macAddress;
    await Model_Device.unblockDevice(macAddress);
    req.flash('success', 'Perangkat berhasil diaktifkan kembali');
    res.redirect('/admin/laporan-akun-ilegal');
  } catch (error) {
    req.flash('error', 'Terjadi kesalahan saat membuka blokir perangkat');
    res.redirect('/admin/data-user');
  }
});

module.exports = router;