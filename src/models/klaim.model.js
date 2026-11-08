const pool = require('../../database/pool');

class KlaimModel {
  static async create({
    kode_klaim,
    id_warga,
    id_katalog,
    biaya_poin,
    nilai_rupiah,
    status_klaim = 'MENUNGGU_VERIFIKASI',
    catatan_admin = null
  }, db = pool) {
    const [result] = await db.query(
      `INSERT INTO klaim_penukaran_poin 
       (kode_klaim, id_warga, id_katalog, biaya_poin, nilai_rupiah, status_klaim, catatan_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [kode_klaim, id_warga, id_katalog, biaya_poin, nilai_rupiah, status_klaim, catatan_admin]
    );
    return {
      id_klaim: result.insertId,
      kode_klaim,
      id_warga,
      id_katalog,
      biaya_poin,
      nilai_rupiah,
      status_klaim,
      tanggal_pengajuan: new Date()
    };
  }

  static async claimCodeExists(kodeKlaim, db = pool) {
    const [rows] = await db.query('SELECT id_klaim FROM klaim_penukaran_poin WHERE kode_klaim = ?', [kodeKlaim]);
    return rows.length > 0;
  }

  static async findById(idKlaim, db = pool) {
    const sql = `
      SELECT 
        c.*,
        k.judul AS nama_item,
        k.kategori_badge,
        k.icon_name,
        w.rt,
        w.rw,
        u.nama AS nama_warga,
        w.no_telp AS kontak_warga
      FROM klaim_penukaran_poin c
      JOIN katalog_penukaran k ON c.id_katalog = k.id_katalog
      JOIN profiles_warga w ON c.id_warga = w.id_warga
      JOIN users u ON w.id_user = u.id_user
      WHERE c.id_klaim = ?
    `;
    const [rows] = await db.query(sql, [idKlaim]);
    return rows[0] || null;
  }

  static async findByIdWithLock(idKlaim, db) {
    const [rows] = await db.query(
      'SELECT * FROM klaim_penukaran_poin WHERE id_klaim = ? FOR UPDATE',
      [idKlaim]
    );
    return rows[0] || null;
  }

  static async findByCitizen(idWarga, db = pool) {
    const sql = `
      SELECT 
        c.id_klaim,
        c.kode_klaim,
        c.id_katalog,
        k.judul AS nama_item,
        k.kategori_badge,
        k.icon_name,
        c.biaya_poin,
        c.nilai_rupiah,
        c.status_klaim,
        c.catatan_admin,
        c.tanggal_pengajuan,
        c.tanggal_verifikasi
      FROM klaim_penukaran_poin c
      JOIN katalog_penukaran k ON c.id_katalog = k.id_katalog
      WHERE c.id_warga = ?
      ORDER BY c.tanggal_pengajuan DESC
    `;
    const [rows] = await db.query(sql, [idWarga]);
    return rows;
  }

  static async getAllClaims({ status, limit = 50 } = {}, db = pool) {
    let sql = `
      SELECT 
        c.id_klaim,
        c.kode_klaim,
        c.id_warga,
        u.nama AS nama_warga,
        w.no_telp AS kontak_warga,
        w.rt,
        w.rw,
        c.id_katalog,
        k.judul AS nama_item,
        k.stok AS sisa_stok_item,
        k.kategori_badge,
        c.biaya_poin,
        c.nilai_rupiah,
        c.status_klaim,
        c.catatan_admin,
        c.tanggal_pengajuan,
        c.tanggal_verifikasi
      FROM klaim_penukaran_poin c
      JOIN profiles_warga w ON c.id_warga = w.id_warga
      JOIN users u ON w.id_user = u.id_user
      JOIN katalog_penukaran k ON c.id_katalog = k.id_katalog
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND c.status_klaim = ?';
      params.push(status);
    }

    sql += ' ORDER BY c.tanggal_pengajuan DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async updateStatus({ id_klaim, status_klaim, catatan_admin = null }, db = pool) {
    const [result] = await db.query(
      `UPDATE klaim_penukaran_poin 
       SET status_klaim = ?, catatan_admin = ?, tanggal_verifikasi = NOW() 
       WHERE id_klaim = ?`,
      [status_klaim, catatan_admin, id_klaim]
    );
    return result.affectedRows > 0;
  }
}

module.exports = KlaimModel;
