var express = require('express');
var router = express.Router();
const { address } = require('address');
var bcrypt = require('bcryptjs');
const Model_Users = require('../Model/Model_Users');
const Model_Warga = require('../Model/Model_Warga');
const Model_Mitra = require('../Model/Model_Mitra');

router.get('/', function(req, res, next) {
  res.render('landing_page/index', { title: 'THIS' });
});

router.get('/register', async(req, res, next) =>{
  res.render('auth/register')
})

router.get('/login', async(req, res, next) =>{
  res.render('auth/login')
})

router.post('/saveusers', async(req, res, next) => {
  try {
    let {nama_users, email, password, role_users} = req.body;
    let enkripsi = await bcrypt.hash(password, 10);
    let Data = { 
      nama_users,
      email,
      password: enkripsi,
      role_users
    }
    await Model_Users.Store(Data);

    req.flash('success', 'Berhasil Register akun');
    res.redirect('/login');

  } catch (error) {
    req.flash('error', 'Gagal membuat akun');
    console.error('Error:', error);
    res.redirect('/login'); 
    next(error);
  }
});

router.post('/log', async (req, res) => {
  let { email, password } = req.body;
  try {
    let Data = await Model_Users.Login(email);

    if (Data.length > 0) {
      let enkripsi = Data[0].password;
      let cek = await bcrypt.compare(password, enkripsi);

      if (cek) {
        req.session.userID = Data[0].id_users;
        req.session.role_users = Data[0].role_users;
        // res.redirect('/dashboard');

        switch (Data[0].role_users) {
          case 'warga':
            const dataWarga = await Model_Warga.getByIdUsers(Data[0].id_users);
            if (!dataWarga || dataWarga.length === 0) {
              req.flash('success', 'Silahkan lengkapi data diri terlebih dahulu');
              return res.redirect('/users/warga/complete-profile-warga');
            } else {
              req.flash('success', 'Berhasil Login');
              return res.redirect('/users');
            }
            break;

          case 'mitra':
            const dataMitra = await Model_Mitra.getByIdUsers(Data[0].id_users);
            if (!dataMitra || dataMitra.length === 0) {
              req.flash('success', 'Silahkan lengkapi data profil anda');
              return res.redirect('/users/mitra/complete-profile-mitra');
            } else {
              const jenisMitra = dataMitra.jenis_mitra;
              console.log('jenis mitra:', jenisMitra)
              if(jenisMitra === 'pemerintah'){
                req.flash('success', 'Berhasil Login');
                return res.redirect('/users/mitra/pemerintah');
              }else if(jenisMitra === 'non-pemerintah'){
                req.flash('success', 'Berhasil Login');
                return res.redirect('/users/mitra/non-pemerintah');
              }else{
                req.flash('error','Mitra tidak valid');
                res.redirect('/login');
              }
            }
            break;

          case 'admin':
            req.flash('success', 'Berhasil Login');
            return res.redirect('/admin/data-user');
            break;

          default:
            req.flash('error', 'Akun tidak valid');
            return res.redirect('/login');
        }

      } else {
        req.flash('error', 'Email atau password salah');
        return res.redirect('/login');
      }
    } else {
      req.flash('error', 'Akun tidak ditemukan');
      return res.redirect('/login');
    }

  } catch (error) {
    req.flash('error', 'Terjadi kesalahan pada server');
    console.error('Error:', error); // Debug error pada console
    return res.redirect('/login');
  }
});


router.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if(err) {
      console.error(err);
    } else {
      res.redirect('/login');
    }
  });
});


router.get('/kotak-balasan', async(req, res, next) => {
  address(async (err, addrs) => {
    if (err) {
      console.error("Error mendapatkan address:", err);
    } else {
      let mac_address = addrs.mac;
      const dataBalasan = await Model_Warga.getAllDataBalasan(mac_address);
        res.render('users/kotak_balasan', {
          rows: dataBalasan
        })
    }
  });
})


module.exports = router;
