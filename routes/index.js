var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
const Model_Users = require('../Model/Model_Users');
const Model_Warga = require('../Model/Model_Warga');
const Model_Mitra = require('../Model/Model_Mitra');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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

router.post('/log', async(req, res) =>{
  let {email, password} = req.body;
  try {
    let Data = await Model_Users.Login(email);

    if(Data.length > 0){
      let enkripsi = Data[0].password;
      let cek = await bcrypt.compare(password, enkripsi);

      if(cek){
        req.session.userID = Data[0].id_users;

        switch(Data[0].role_users){
          case 'warga':
            const dataWarga = await Model_Warga.getByIdUsers(Data[0].id_users);
            if(!dataWarga || dataWarga.length === 0){
              req.flash('success','Silahkan lengkapi data profil terlebih dahulu');
              res.redirect('/users/warga/complete-profile')
            } else{
              req.flash('success','Berhasil Login');
              res.redirect('/users/warga')
            }
            break;

            case 'mitra':
              const dataMitra = await Model_Mitra.getByIdUsers(Data[0].id_users);
              if(!dataMitra || dataMitra.length === 0){
                req.flash('success','Silahkan lengkapi data profil anda');
                res.redirect('/users/mitra/complete-profile');
              } else {
                req.flash('success','Berhasil Login');
                res.redirect('/users/mitra');
              }
              break;

            case 'admin':
              req.flash('success','Berhasil Login');
              res.redirect('/admin/dashboard');
              break;

            default:
              req.flash('error','akun tidak valid');
              res.redirect('/')
        }

      }else{
        req.flash('error','email atau password salah');
        res.redirect('/login');
      }
    }
  } catch (error) {
    req.flash('error','Akun tidak ditemukan');
    res.redirect('/login');
  }
})

router.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if(err) {
      console.error(err);
    } else {
      res.redirect('/login');
    }
  });
});



module.exports = router;
