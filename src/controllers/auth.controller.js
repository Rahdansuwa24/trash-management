const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../database/pool');
const env = require('../config/env');
const { UserModel, WargaModel, MitraModel } = require('../models');

function signToken(user) {
  return jwt.sign(
    {
      id_user: user.id_user,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.'
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Kombinasi email atau password salah.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Kombinasi email atau password salah.'
      });
    }

    if (user.status === 'frozen' || user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: `Akun Anda sedang dibekukan/diblokir (${user.status}). Hubungi administrator.`
      });
    }

    let profile = null;
    if (user.role === 'warga') {
      profile = await WargaModel.findByUserId(user.id_user);
    } else if (user.role === 'mitra') {
      profile = await MitraModel.findByUserId(user.id_user);
    }

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id_user: user.id_user,
        nama: user.nama,
        email: user.email,
        role: user.role,
        status: user.status,
        profile
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      nama,
      email,
      password,
      role = 'warga',
      no_telp,
      alamat,
      rt = '03',
      rw = '05',
      kelurahan = 'Kalirungkut',
      kecamatan = 'Rungkut',
      kota = 'Surabaya',
      instansi_nama,
      jenis_mitra = 'satgas_lapangan',
      wilayah_tugas = 'RW 05'
    } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi.'
      });
    }

    const existing = await UserModel.findByEmail(email, connection);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Gunakan email lain.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.beginTransaction();

    const createdUser = await UserModel.create({
      nama,
      email,
      password: hashedPassword,
      role,
      status: 'active'
    }, connection);

    const newUserId = createdUser.id_user;

    if (role === 'warga') {
      await WargaModel.createProfile({
        id_user: newUserId,
        no_telp,
        alamat,
        rt,
        rw,
        kelurahan,
        kecamatan,
        kota
      }, connection);
    } else if (role === 'mitra') {
      await MitraModel.createProfile({
        id_user: newUserId,
        jenis_mitra,
        instansi_nama: instansi_nama || nama,
        wilayah_tugas,
        no_telp,
        alamat,
        kelurahan,
        kecamatan,
        kota
      }, connection);
    }

    await connection.commit();

    const userObj = { id_user: newUserId, email, role };
    const token = signToken(userObj);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      token,
      user: {
        id_user: newUserId,
        nama,
        email,
        role
      }
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'warga') {
      profile = await WargaModel.findByUserId(user.id_user);
    } else if (user.role === 'mitra') {
      profile = await MitraModel.findByUserId(user.id_user);
    }

    res.json({
      success: true,
      user: {
        ...user,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};
