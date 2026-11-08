const pool = require('../../database/pool');

class LaporanModel {
  static async create({
    kode_tiket,
    id_user = null,
    id_mitra_penangan = null,
    nama_pelapor = 'Warga Anonim',
    nomor_kontak,
    client_device_id = null,
    deskripsi_kejadian,
    foto_bukti_url,
    video_bukti_url = null,
    alamat_lokasi,
    rt = '03',
    rw = '05',
    kota,
    kecamatan,
    kelurahan = 'Kalirungkut',
    latitude,
    longitude,
    status = 'MENUNGGU_VERIFIKASI'
  }, db = pool) {
    const insertSql = `
      INSERT INTO laporan_sampah_ilegal 
      (kode_tiket, id_user, id_mitra_penangan, nama_pelapor, nomor_kontak, client_device_id, deskripsi_kejadian, foto_bukti_url, video_bukti_url, alamat_lokasi, rt, rw, kota, kecamatan, kelurahan, latitude, longitude, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertSql, [
      kode_tiket,
      id_user,
      id_mitra_penangan,
      nama_pelapor,
      nomor_kontak,
      client_device_id,
      deskripsi_kejadian,
      foto_bukti_url,
      video_bukti_url,
      alamat_lokasi,
      rt,
      rw,
      kota,
      kecamatan,
      kelurahan,
      parseFloat(latitude),
      parseFloat(longitude),
      status
    ]);

    return {
      id_laporan: result.insertId,
      kode_tiket,
      status,
      foto_bukti_url,
      created_at: new Date()
    };
  }

  static async ticketExists(kodeTiket, db = pool) {
    const [rows] = await db.query('SELECT id_laporan FROM laporan_sampah_ilegal WHERE kode_tiket = ?', [kodeTiket]);
    return rows.length > 0;
  }

  static async findById(idLaporan, db = pool) {
    const [rows] = await db.query('SELECT * FROM laporan_sampah_ilegal WHERE id_laporan = ?', [idLaporan]);
    return rows[0] || null;
  }

  static async findByTicketCode(kodeTiket, db = pool) {
    const sql = `
      SELECT 
        l.id_laporan,
        l.kode_tiket,
        l.nama_pelapor,
        l.nomor_kontak,
        l.deskripsi_kejadian,
        l.foto_bukti_url,
        l.video_bukti_url,
        l.alamat_lokasi,
        l.kota,
        l.kecamatan,
        l.kelurahan,
        l.latitude,
        l.longitude,
        l.status,
        l.created_at,
        l.updated_at,
        m.instansi_nama AS penanggung_jawab_dlh,
        m.no_telp AS kontak_dlh
      FROM laporan_sampah_ilegal l
      LEFT JOIN profiles_mitra m ON l.id_mitra_penangan = m.id_mitra
      WHERE l.kode_tiket = ?
    `;
    const [rows] = await db.query(sql, [kodeTiket]);
    return rows[0] || null;
  }

  static async getMapReports({ kota, limit = 50 } = {}, db = pool) {
    let sql = `
      SELECT 
        id_laporan,
        kode_tiket,
        deskripsi_kejadian,
        foto_bukti_url,
        alamat_lokasi,
        kota,
        kecamatan,
        latitude,
        longitude,
        status,
        created_at
      FROM laporan_sampah_ilegal
    `;
    const params = [];

    if (kota) {
      sql += ' WHERE LOWER(kota) = LOWER(?)';
      params.push(kota);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async getAssignedReports({ status, kota, limit = 50 } = {}, db = pool) {
    let sql = `
      SELECT 
        l.id_laporan,
        l.kode_tiket,
        l.nama_pelapor,
        l.nomor_kontak,
        l.deskripsi_kejadian,
        l.foto_bukti_url,
        l.alamat_lokasi,
        l.kota,
        l.kecamatan,
        l.latitude,
        l.longitude,
        l.status,
        l.created_at,
        l.updated_at
      FROM laporan_sampah_ilegal l
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND l.status = ?';
      params.push(status);
    }
    if (kota) {
      sql += ' AND LOWER(l.kota) = LOWER(?)';
      params.push(kota);
    }

    sql += ' ORDER BY l.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async updateStatusAndPartner(idLaporan, status, idMitra, db = pool) {
    const [result] = await db.query(
      'UPDATE laporan_sampah_ilegal SET status = ?, id_mitra_penangan = ? WHERE id_laporan = ?',
      [status, idMitra, idLaporan]
    );
    return result.affectedRows > 0;
  }
}

module.exports = LaporanModel;
