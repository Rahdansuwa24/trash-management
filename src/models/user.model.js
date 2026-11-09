const pool = require('../../database/pool');

class UserModel {
  static async findByEmail(email, db = pool) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async findById(idUser, db = pool) {
    const [rows] = await db.query('SELECT * FROM users WHERE id_user = ?', [idUser]);
    return rows[0] || null;
  }

  static async findUsers({ role, status, limit = 100 } = {}, db = pool) {
    let sql = `
      SELECT 
        u.id_user, u.nama, u.email, u.role, u.status, u.created_at,
        pw.rt, pw.rw, pw.alamat as alamat_warga, pw.no_telp as no_telp_warga,
        pm.id_mitra, pm.jenis_mitra, pm.instansi_nama, pm.wilayah_tugas, pm.no_telp as no_telp_mitra
      FROM users u
      LEFT JOIN profiles_warga pw ON u.id_user = pw.id_user
      LEFT JOIN profiles_mitra pm ON u.id_user = pm.id_user
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      sql += ' AND u.role = ?';
      params.push(role);
    }
    if (status) {
      sql += ' AND u.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY u.id_user DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async updateStatus(idUser, status, db = pool) {
    const [result] = await db.query('UPDATE users SET status = ? WHERE id_user = ?', [status, idUser]);
    return result.affectedRows > 0;
  }

  static async create({ nama, email, password, role = 'warga', status = 'active' }, db = pool) {
    const [result] = await db.query(
      'INSERT INTO users (nama, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [nama, email, password, role, status]
    );
    return {
      id_user: result.insertId,
      nama,
      email,
      role,
      status
    };
  }

  static async getPlatformStats(db = pool) {
    const [[userCount]] = await db.query('SELECT COUNT(*) AS total_users FROM users');
    const [[reportCount]] = await db.query('SELECT COUNT(*) AS total_reports FROM laporan_sampah_ilegal');
    const [[resolvedCount]] = await db.query('SELECT COUNT(*) AS resolved_reports FROM laporan_sampah_ilegal WHERE status = "SELESAI_DIBERSIHKAN"');
    const [[trxStats]] = await db.query('SELECT COUNT(*) AS total_trx, COALESCE(SUM(berat_aktual_kg), 0) AS total_kg, COALESCE(SUM(total_poin_diperoleh), 0) AS total_points FROM transaksi_sampah_komersil WHERE status = "SELESAI"');

    return {
      total_users: userCount.total_users,
      total_reports: reportCount.total_reports,
      resolved_reports: resolvedCount.resolved_reports,
      total_waste_recycled_kg: parseFloat(trxStats.total_kg),
      total_points_distributed: parseInt(trxStats.total_points, 10),
      total_transactions: trxStats.total_trx
    };
  }
}

module.exports = UserModel;
