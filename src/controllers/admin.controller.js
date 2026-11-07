const pool = require('../../database/pool');

exports.getUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    let sql = 'SELECT id_user, nama, email, role, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY id_user DESC LIMIT 100';

    const [rows] = await pool.query(sql, params);
    res.json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const idUser = req.params.id;
    const { status } = req.body;

    if (!['active', 'frozen', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus salah satu dari: active, frozen, atau blocked.'
      });
    }

    await pool.query('UPDATE users SET status = ? WHERE id_user = ?', [status, idUser]);

    res.json({
      success: true,
      message: `Status pengguna berhasil diperbarui menjadi ${status}.`,
      data: { id_user: idUser, status }
    });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const [[userCount]] = await pool.query('SELECT COUNT(*) AS total_users FROM users');
    const [[reportCount]] = await pool.query('SELECT COUNT(*) AS total_reports FROM laporan_sampah_ilegal');
    const [[resolvedCount]] = await pool.query('SELECT COUNT(*) AS resolved_reports FROM laporan_sampah_ilegal WHERE status = "SELESAI_DIBERSIHKAN"');
    const [[trxStats]] = await pool.query('SELECT COUNT(*) AS total_trx, COALESCE(SUM(berat_aktual_kg), 0) AS total_kg, COALESCE(SUM(total_poin_diperoleh), 0) AS total_points FROM transaksi_sampah_komersil WHERE status = "SELESAI"');

    res.json({
      success: true,
      data: {
        total_users: userCount.total_users,
        total_reports: reportCount.total_reports,
        resolved_reports: resolvedCount.resolved_reports,
        total_waste_recycled_kg: parseFloat(trxStats.total_kg),
        total_points_distributed: parseInt(trxStats.total_points, 10),
        total_transactions: trxStats.total_trx
      }
    });
  } catch (error) {
    next(error);
  }
};
