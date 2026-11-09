const pool = require('../../database/pool');

class TransaksiModel {
  static async getCategories(db = pool) {
    const [rows] = await db.query(
      'SELECT id_kategori, nama_kategori, poin_per_kg, estimasi_harga_per_kg, deskripsi FROM kategori_sampah WHERE is_active = 1 ORDER BY id_kategori ASC'
    );
    return rows;
  }

  static async findCategoryById(idKategori, db = pool) {
    const [rows] = await db.query(
      'SELECT poin_per_kg, nama_kategori FROM kategori_sampah WHERE id_kategori = ? AND is_active = 1',
      [idKategori]
    );
    return rows[0] || null;
  }

  static async transactionCodeExists(kodeTransaksi, db = pool) {
    const [rows] = await db.query('SELECT id_transaksi FROM transaksi_sampah_komersil WHERE kode_transaksi = ?', [kodeTransaksi]);
    return rows.length > 0;
  }

  static async create({
    kode_transaksi,
    id_warga,
    id_mitra = null,
    id_kategori,
    estimasi_berat_kg,
    total_poin_diperoleh,
    foto_sampah_url = null,
    alamat_jemput,
    rt = '03',
    rw = '05',
    kota,
    kecamatan,
    latitude = null,
    longitude = null,
    catatan_warga = null,
    status = 'MENUNGGU_PENJEMPUTAN'
  }, db = pool) {
    const insertSql = `
      INSERT INTO transaksi_sampah_komersil 
      (kode_transaksi, id_warga, id_mitra, id_kategori, estimasi_berat_kg, total_poin_diperoleh, foto_sampah_url, alamat_jemput, rt, rw, kota, kecamatan, latitude, longitude, catatan_warga, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertSql, [
      kode_transaksi,
      id_warga,
      id_mitra,
      id_kategori,
      estimasi_berat_kg,
      total_poin_diperoleh,
      foto_sampah_url,
      alamat_jemput,
      rt,
      rw,
      kota,
      kecamatan,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      catatan_warga,
      status
    ]);

    return {
      id_transaksi: result.insertId,
      kode_transaksi,
      status
    };
  }

  static async findByCitizen(idWarga, db = pool) {
    const sql = `
      SELECT 
        t.id_transaksi,
        t.kode_transaksi,
        k.nama_kategori,
        k.poin_per_kg,
        t.estimasi_berat_kg,
        t.berat_aktual_kg,
        t.total_poin_diperoleh,
        t.foto_sampah_url,
        t.alamat_jemput,
        t.rt,
        t.rw,
        t.status,
        t.tanggal_transaksi,
        t.tanggal_selesai,
        t.catatan_warga,
        t.catatan_mitra,
        t.id_mitra,
        m.instansi_nama AS nama_mitra,
        m.no_telp AS kontak_mitra,
        u_mitra.nama AS nama_petugas
      FROM transaksi_sampah_komersil t
      JOIN kategori_sampah k ON t.id_kategori = k.id_kategori
      LEFT JOIN profiles_mitra m ON t.id_mitra = m.id_mitra
      LEFT JOIN users u_mitra ON m.id_user = u_mitra.id_user
      WHERE t.id_warga = ?
      ORDER BY t.tanggal_transaksi DESC
    `;
    const [rows] = await db.query(sql, [idWarga]);
    return rows;
  }

  static async getWasteBankPickups({ status, rt, id_mitra, limit = 50 } = {}, db = pool) {
    let sql = `
      SELECT 
        t.id_transaksi,
        t.kode_transaksi,
        w.id_warga,
        u.nama AS nama_warga,
        w.no_telp AS kontak_warga,
        k.nama_kategori,
        k.poin_per_kg,
        t.estimasi_berat_kg,
        t.berat_aktual_kg,
        t.total_poin_diperoleh,
        t.alamat_jemput,
        t.rt,
        t.rw,
        t.kota,
        t.kecamatan,
        t.status,
        t.foto_sampah_url,
        t.tanggal_transaksi,
        t.catatan_warga,
        t.catatan_mitra,
        t.id_mitra,
        m.instansi_nama AS nama_mitra,
        m.rt_tugas AS rt_tugas_mitra,
        m.no_telp AS kontak_mitra,
        u_mitra.nama AS nama_petugas
      FROM transaksi_sampah_komersil t
      JOIN profiles_warga w ON t.id_warga = w.id_warga
      JOIN users u ON w.id_user = u.id_user
      JOIN kategori_sampah k ON t.id_kategori = k.id_kategori
      LEFT JOIN profiles_mitra m ON t.id_mitra = m.id_mitra
      LEFT JOIN users u_mitra ON m.id_user = u_mitra.id_user
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (rt) {
      sql += ' AND t.rt = ?';
      params.push(rt);
    }
    if (id_mitra) {
      sql += ' AND t.id_mitra = ?';
      params.push(id_mitra);
    }

    sql += ' ORDER BY t.tanggal_transaksi DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async assignPickupByAdmin(idTransaksi, idMitra, catatanAdmin = 'Didisposisikan oleh Koordinator RW', db = pool) {
    const [result] = await db.query(
      `UPDATE transaksi_sampah_komersil 
       SET id_mitra = ?, 
           status = 'DIKONFIRMASI_MITRA',
           catatan_mitra = CASE 
             WHEN catatan_mitra IS NULL OR catatan_mitra = '' THEN ? 
             ELSE CONCAT(catatan_mitra, ' | ', ?) 
           END
       WHERE id_transaksi = ? AND status IN ('MENUNGGU_PENJEMPUTAN', 'DIKONFIRMASI_MITRA')`,
      [idMitra, catatanAdmin, catatanAdmin, idTransaksi]
    );
    return result.affectedRows > 0;
  }

  static async claimPickup(idTransaksi, idMitra, db = pool) {
    const [result] = await db.query(
      `UPDATE transaksi_sampah_komersil 
       SET id_mitra = ?, status = 'DIKONFIRMASI_MITRA' 
       WHERE id_transaksi = ? AND status = 'MENUNGGU_PENJEMPUTAN'`,
      [idMitra, idTransaksi]
    );
    return result.affectedRows > 0;
  }

  static async findWithCategoryAndWarga(idTransaksi, db = pool) {
    const [rows] = await db.query(
      `SELECT t.*, k.poin_per_kg, k.nama_kategori, w.id_warga 
       FROM transaksi_sampah_komersil t
       JOIN kategori_sampah k ON t.id_kategori = k.id_kategori
       JOIN profiles_warga w ON t.id_warga = w.id_warga
       WHERE t.id_transaksi = ?`,
      [idTransaksi]
    );
    return rows[0] || null;
  }

  static async completeTransaction({
    id_transaksi,
    berat_aktual_kg,
    total_poin_diperoleh,
    id_mitra,
    catatan_mitra = null
  }, db = pool) {
    const [result] = await db.query(
      `UPDATE transaksi_sampah_komersil 
       SET status = 'SELESAI', berat_aktual_kg = ?, total_poin_diperoleh = ?, id_mitra = ?, catatan_mitra = ?, tanggal_selesai = NOW()
       WHERE id_transaksi = ?`,
      [berat_aktual_kg, total_poin_diperoleh, id_mitra, catatan_mitra, id_transaksi]
    );
    return result.affectedRows > 0;
  }
}

module.exports = TransaksiModel;
