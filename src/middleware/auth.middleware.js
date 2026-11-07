const jwt = require('jsonwebtoken');
const env = require('../config/env');
const pool = require('../../database/pool');

function extractToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

exports.authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token autentikasi tidak ditemukan.'
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const [rows] = await pool.query('SELECT id_user, nama, email, role, status FROM users WHERE id_user = ?', [decoded.id_user]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan.'
      });
    }

    const user = rows[0];
    if (user.status === 'frozen' || user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: `Akun Anda sedang berstatus ${user.status}. Hubungi administrator.`
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.'
    });
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const [rows] = await pool.query('SELECT id_user, nama, email, role, status FROM users WHERE id_user = ?', [decoded.id_user]);
      if (rows.length > 0 && rows[0].status === 'active') {
        req.user = rows[0];
      }
    }
  } catch (e) {
    // optional, continue
  }
  next();
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki hak akses untuk tindakan ini.'
      });
    }
    next();
  };
};
