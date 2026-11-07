const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../database/pool');
const env = require('../config/env');

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

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Kombinasi email atau password salah.'
      });
    }

    const user = users[0];
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
      const [wRows] = await pool.query('SELECT * FROM profiles_warga WHERE id_user = ?', [user.id_user]);
      if (wRows.length > 0) profile = wRows[0];
    } else if (user.role === 'mitra') {
      const [mRows] = await pool.query('SELECT * FROM profiles_mitra WHERE id_user = ?', [user.id_user]);
      if (mRows.length > 0) profile = mRows[0];
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
      kota = 'Surabaya',
      kecamatan = 'Rungkut',
      instansi_nama,
      jenis_mitra
    } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi.'
      });
    }

    const [existing] = await connection.query('SELECT id_user FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Gunakan email lain.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.beginTransaction();

    const [userResult] = await connection.query(
      'INSERT INTO users (nama, email, password, role, status) VALUES (?, ?, ?, ?, "active")',
      [nama, email, hashedPassword, role]
    );

    const newUserId = userResult.insertId;

    if (role === 'warga') {
      await connection.query(
        'INSERT INTO profiles_warga (id_user, no_telp, alamat, kota, kecamatan, total_poin) VALUES (?, ?, ?, ?, ?, 0)',
        [newUserId, no_telp || null, alamat || null, kota, kecamatan]
      );
    } else if (role === 'mitra') {
      await connection.query(
        'INSERT INTO profiles_mitra (id_user, jenis_mitra, instansi_nama, no_telp, alamat, kota, kecamatan) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newUserId, jenis_mitra || 'non-pemerintah', instansi_nama || nama, no_telp || null, alamat || null, kota, kecamatan]
      );
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
      const [wRows] = await pool.query('SELECT * FROM profiles_warga WHERE id_user = ?', [user.id_user]);
      if (wRows.length > 0) profile = wRows[0];
    } else if (user.role === 'mitra') {
      const [mRows] = await pool.query('SELECT * FROM profiles_mitra WHERE id_user = ?', [user.id_user]);
      if (mRows.length > 0) profile = mRows[0];
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
