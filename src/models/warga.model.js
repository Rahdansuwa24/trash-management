const pool = require('../../database/pool');

class WargaModel {
  static async findByUserId(idUser, db = pool) {
    const [rows] = await db.query('SELECT * FROM profiles_warga WHERE id_user = ?', [idUser]);
    return rows[0] || null;
  }

  static async findById(idWarga, db = pool) {
    const [rows] = await db.query('SELECT * FROM profiles_warga WHERE id_warga = ?', [idWarga]);
    return rows[0] || null;
  }

  static async findByUserIdWithLock(idUser, db) {
    const [rows] = await db.query('SELECT id_warga, total_poin FROM profiles_warga WHERE id_user = ? FOR UPDATE', [idUser]);
    return rows[0] || null;
  }

  static async createProfile({
    id_user,
    no_telp = null,
    alamat = null,
    rt = '03',
    rw = '05',
    kelurahan = 'Kalirungkut',
    kecamatan = 'Rungkut',
    kota = 'Surabaya'
  }, db = pool) {
    const [result] = await db.query(
      'INSERT INTO profiles_warga (id_user, no_telp, alamat, rt, rw, kelurahan, kecamatan, kota, total_poin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
      [id_user, no_telp, alamat, rt, rw, kelurahan, kecamatan, kota]
    );
    return {
      id_warga: result.insertId,
      id_user,
      no_telp,
      alamat,
      rt,
      rw,
      kelurahan,
      kecamatan,
      kota,
      total_poin: 0
    };
  }

  static async updatePoints(idWarga, totalPoin, db = pool) {
    const [result] = await db.query('UPDATE profiles_warga SET total_poin = ? WHERE id_warga = ?', [totalPoin, idWarga]);
    return result.affectedRows > 0;
  }

  static async addPoints(idWarga, pointsToAdd, db = pool) {
    const [result] = await db.query('UPDATE profiles_warga SET total_poin = total_poin + ? WHERE id_warga = ?', [pointsToAdd, idWarga]);
    return result.affectedRows > 0;
  }

  static async getPoints(idWarga, db = pool) {
    const [rows] = await db.query('SELECT total_poin FROM profiles_warga WHERE id_warga = ?', [idWarga]);
    return rows.length > 0 ? rows[0].total_poin : 0;
  }

  static async getPointsHistory(idWarga, limit = 20, db = pool) {
    const [rows] = await db.query(
      'SELECT id_riwayat, perubahan_poin, tipe, keterangan, created_at FROM riwayat_poin WHERE id_warga = ? ORDER BY created_at DESC LIMIT ?',
      [idWarga, Number(limit)]
    );
    return rows;
  }

  static async addPointsLedger({ id_warga, id_transaksi = null, perubahan_poin, tipe, keterangan }, db = pool) {
    const [result] = await db.query(
      'INSERT INTO riwayat_poin (id_warga, id_transaksi, perubahan_poin, tipe, keterangan) VALUES (?, ?, ?, ?, ?)',
      [id_warga, id_transaksi, perubahan_poin, tipe, keterangan]
    );
    return {
      id_riwayat: result.insertId,
      id_warga,
      id_transaksi,
      perubahan_poin,
      tipe,
      keterangan
    };
  }
}

module.exports = WargaModel;
