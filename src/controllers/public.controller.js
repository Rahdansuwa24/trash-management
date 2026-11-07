const pool = require('../../database/pool');
const { uploadToR2 } = require('../config/s3');
const crypto = require('crypto');

/**
 * Generate unique public ticket code, e.g. LAPOR-2611-9A4B
 */
function generateTicketCode() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `LAPOR-${year}${month}-${randomChars}`;
}

exports.createIllegalReport = async (req, res, next) => {
  try {
    const {
      nama_pelapor = 'Warga Anonim',
      nomor_kontak,
      client_device_id,
      deskripsi_kejadian,
      alamat_lokasi,
      rt = '03',
      rw = '05',
      kota,
      kecamatan,
      kelurahan = 'Kalirungkut',
      latitude,
      longitude
    } = req.body;

    if (!nomor_kontak || !deskripsi_kejadian || !alamat_lokasi || !kota || !kecamatan) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi semua kolom wajib (kontak, deskripsi, alamat, kota, kecamatan).'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Koordinat lokasi (latitude dan longitude) wajib disertakan.'
      });
    }

    const files = req.files || {};
    const fotoFile = files.file_foto ? files.file_foto[0] : (req.file || null);
    const videoFile = files.file_video ? files.file_video[0] : null;

    if (!fotoFile) {
      return res.status(400).json({
        success: false,
        message: 'Foto bukti sampah liar wajib diunggah.'
      });
    }

    const fotoUrl = await uploadToR2(fotoFile, 'illegal-reports/photos');
    const videoUrl = videoFile ? await uploadToR2(videoFile, 'illegal-reports/videos') : null;

    // Check if Satgas partner exists to auto-assign
    let mitraId = null;
    try {
      const [mitraRows] = await pool.query(
        'SELECT id_mitra FROM profiles_mitra WHERE (jenis_mitra = "satgas_lapangan" OR jenis_mitra = "pemerintah") LIMIT 1'
      );
      if (mitraRows.length > 0) {
        mitraId = mitraRows[0].id_mitra;
      }
    } catch (e) {
      // Non-blocking lookup
    }

    let kodeTiket = generateTicketCode();
    let isUnique = false;
    let attempts = 0;

    // Guarantee uniqueness
    while (!isUnique && attempts < 5) {
      const [existing] = await pool.query('SELECT id_laporan FROM laporan_sampah_ilegal WHERE kode_tiket = ?', [kodeTiket]);
      if (existing.length === 0) {
        isUnique = true;
      } else {
        kodeTiket = generateTicketCode();
        attempts++;
      }
    }

    const insertSql = `
      INSERT INTO laporan_sampah_ilegal 
      (kode_tiket, id_user, id_mitra_penangan, nama_pelapor, nomor_kontak, client_device_id, deskripsi_kejadian, foto_bukti_url, video_bukti_url, alamat_lokasi, rt, rw, kota, kecamatan, kelurahan, latitude, longitude, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MENUNGGU_VERIFIKASI')
    `;

    const userId = req.user ? req.user.id_user : null;

    const [result] = await pool.query(insertSql, [
      kodeTiket,
      userId,
      mitraId,
      nama_pelapor,
      nomor_kontak,
      client_device_id || null,
      deskripsi_kejadian,
      fotoUrl,
      videoUrl,
      alamat_lokasi,
      rt,
      rw,
      kota,
      kecamatan,
      kelurahan,
      parseFloat(latitude),
      parseFloat(longitude)
    ]);

    res.status(201).json({
      success: true,
      message: 'Laporan sampah liar berhasil dikirim. Simpan kode tiket Anda untuk memantau status penanganan.',
      kode_tiket: kodeTiket,
      data: {
        id_laporan: result.insertId,
        kode_tiket: kodeTiket,
        status: 'MENUNGGU_VERIFIKASI',
        foto_bukti_url: fotoUrl,
        created_at: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.lookupTicket = async (req, res, next) => {
  try {
    const rawCode = req.params.code || '';
    const kodeTiket = rawCode.trim().toUpperCase();

    if (!kodeTiket) {
      return res.status(400).json({
        success: false,
        message: 'Kode tiket tidak boleh kosong.'
      });
    }

    const reportSql = `
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

    const [reports] = await pool.query(reportSql, [kodeTiket]);

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Tiket "${kodeTiket}" tidak ditemukan. Pastikan format penulisan sesuai (contoh: LAPOR-2611-8921).`
      });
    }

    const report = reports[0];

    // Fetch timeline updates (tindak lanjut by DLH)
    const timelineSql = `
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

    const [timeline] = await pool.query(timelineSql, [report.id_laporan]);

    res.json({
      success: true,
      data: {
        ...report,
        timeline
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getMapReports = async (req, res, next) => {
  try {
    const { kota } = req.query;
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

    sql += ' ORDER BY created_at DESC LIMIT 50';

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
