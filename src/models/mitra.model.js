const pool = require('../../database/pool');

class MitraModel {
  static async findByUserId(idUser, db = pool) {
    const [rows] = await db.query('SELECT * FROM profiles_mitra WHERE id_user = ?', [idUser]);
    return rows[0] || null;
  }

  static async findById(idMitra, db = pool) {
    const [rows] = await db.query('SELECT * FROM profiles_mitra WHERE id_mitra = ?', [idMitra]);
    return rows[0] || null;
  }

  static async findFirstByRole(roles = ['satgas_lapangan', 'pemerintah'], db = pool) {
    const [rows] = await db.query(
      'SELECT id_mitra FROM profiles_mitra WHERE jenis_mitra IN (?) LIMIT 1',
      [roles]
    );
    return rows[0] ? rows[0].id_mitra : null;
  }

  static async createProfile({
    id_user,
    jenis_mitra = 'satgas_lapangan',
    instansi_nama,
    wilayah_tugas = 'RW 05',
    no_telp = null,
    alamat = null,
    kelurahan = 'Kalirungkut',
    kecamatan = 'Rungkut',
    kota = 'Surabaya'
  }, db = pool) {
    const [result] = await db.query(
      'INSERT INTO profiles_mitra (id_user, jenis_mitra, instansi_nama, wilayah_tugas, no_telp, alamat, kelurahan, kecamatan, kota) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id_user, jenis_mitra, instansi_nama, wilayah_tugas, no_telp, alamat, kelurahan, kecamatan, kota]
    );
    return {
      id_mitra: result.insertId,
      id_user,
      jenis_mitra,
      instansi_nama,
      wilayah_tugas,
      no_telp,
      alamat,
      kelurahan,
      kecamatan,
      kota
    };
  }

  static async addCleanupAction({ id_laporan, id_mitra, keterangan_tindakan, foto_bukti_penanganan_url }, db = pool) {
    const [result] = await db.query(
      'INSERT INTO tindak_lanjut_aduan (id_laporan, id_mitra, keterangan_tindakan, foto_bukti_penanganan_url) VALUES (?, ?, ?, ?)',
      [id_laporan, id_mitra, keterangan_tindakan, foto_bukti_penanganan_url]
    );
    return {
      id_tindak_lanjut: result.insertId,
      id_laporan,
      id_mitra,
      keterangan_tindakan,
      foto_bukti_penanganan_url
    };
  }

  static async getTimelineByReportId(idLaporan, db = pool) {
    const sql = `
      SELECT 
        t.id_tindak_lanjut,
        t.keterangan_tindakan,
        t.foto_bukti_penanganan_url,
        t.created_at,
        m.instansi_nama AS dilakukan_oleh
      FROM tindak_lanjut_aduan t
      JOIN profiles_mitra m ON t.id_mitra = m.id_mitra
      WHERE t.id_laporan = ?
      ORDER BY t.created_at ASC
    `;
    const [rows] = await db.query(sql, [idLaporan]);
    return rows;
  }
}

module.exports = MitraModel;
