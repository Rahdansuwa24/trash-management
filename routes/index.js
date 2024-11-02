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
      nama: nama_users,
      email,
      password: enkripsi,
      role_users
    }
    
    const savedUser = await Model_Users.Store(Data);

    req.session.userID = savedUser.id_users;
    req.session.roleUser = role_users;

    req.flash('success', 'Berhasil Register akun');

    if (role_users.toLowerCase() === 'warga') {
      res.redirect('/create-data-warga');
    } else if (role_users.toLowerCase() === 'mitra') {
      res.redirect('/create-data-mitra');
    } else {
      res.redirect('/admin/dashboard');
    }

  } catch (error) {
    req.flash('error', 'Gagal membuat akun');
    console.error('Error:', error);
    res.redirect('/register'); 
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
        res.redirect('/dashboard');
        if(Data[0].role_users == 'admin'){
          req.flash('success','Berhasil Login');
          res.redirect('/users/admin');
        }else if(Data[0].role_users == 'mitra'){
          req.flash('success','Berhasil Login');
          res.redirect('/users/mitra');
        }else if(Data[0].role_users == 'warga'){
          req.flash('success','Berhasil Login');
          res.redirect('/users/warga');
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

router.get('/create-data-warga', (req, res) => {
  if (!req.session.userId || req.session.roleUsers !== 'warga') {
    req.flash('error', 'Akses tidak diizinkan');
    return res.redirect('/');
  }
  res.render('warga/create-data-warga');
});

router.post('/save-data-warga', async(req, res) => {
  try {
    const { jenis_kelamin, no_telp, alamat } = req.body;
    
    const dataWarga = {
      id_users: req.session.userId,
      jenis_kelamin,
      no_telp,
      alamat
    }
    
    await Model_Warga.Store(dataWarga);
    
    delete req.session.userId;
    delete req.session.roleUsers;
    
    req.flash('success', 'Data akun berhasil disimpan');
    res.redirect('/login');
    
  } catch (error) {
    req.flash('error', 'Terjadi kesalahan pada fungsi');
    res.redirect('/create-data-warga');
  }
});

router.get('/create-data-mitra', (req, res) => {
  if (!req.session.userId || req.session.roleUsers !== 'warga') {
    req.flash('error', 'Akses tidak diizinkan');
    return res.redirect('/');
  }
  res.render('mitra/create-data-mitra');
});

router.post('/save-data-mitra', async(req, res) => {
  try {
    const { jenis_mitra, no_telp, alamat } = req.body;
    
    const dataWarga = {
      id_users: req.session.userId,
      jenis_mitra,
      no_telp,
      alamat
    }
    
    await Model_Mitra.Store(dataWarga);
    
    delete req.session.userId;
    delete req.session.roleUsers;
    
    req.flash('success', 'Data akun berhasil disimpan');
    res.redirect('/login');
    
  } catch (error) {
    req.flash('error', 'Terjadi kesalahan pada fungsi');
    res.redirect('/create-data-warga');
  }
});


module.exports = router;
