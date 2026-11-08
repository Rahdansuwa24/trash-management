const { uploadToR2 } = require('../config/s3');
const crypto = require('crypto');
const { LaporanModel, MitraModel } = require('../models');

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
      mitraId = await MitraModel.findFirstByRole(['satgas_lapangan', 'pemerintah']);
    } catch (e) {
      // Non-blocking lookup
    }

    let kodeTiket = generateTicketCode();
    let isUnique = false;
    let attempts = 0;

    // Guarantee uniqueness
    while (!isUnique && attempts < 5) {
      const exists = await LaporanModel.ticketExists(kodeTiket);
      if (!exists) {
        isUnique = true;
      } else {
        kodeTiket = generateTicketCode();
        attempts++;
      }
    }

    const userId = req.user ? req.user.id_user : null;

    const createdReport = await LaporanModel.create({
      kode_tiket: kodeTiket,
      id_user: userId,
      id_mitra_penangan: mitraId,
      nama_pelapor,
      nomor_kontak,
      client_device_id: client_device_id || null,
      deskripsi_kejadian,
      foto_bukti_url: fotoUrl,
      video_bukti_url: videoUrl,
      alamat_lokasi,
      rt,
      rw,
      kota,
      kecamatan,
      kelurahan,
      latitude,
      longitude,
      status: 'MENUNGGU_VERIFIKASI'
    });

    res.status(201).json({
      success: true,
      message: 'Laporan sampah liar berhasil dikirim. Simpan kode tiket Anda untuk memantau status penanganan.',
      kode_tiket: kodeTiket,
      data: createdReport
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

    const report = await LaporanModel.findByTicketCode(kodeTiket);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Tiket "${kodeTiket}" tidak ditemukan. Pastikan format penulisan sesuai (contoh: LAPOR-2611-8921).`
      });
    }

    const timeline = await MitraModel.getTimelineByReportId(report.id_laporan);

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
    const rows = await LaporanModel.getMapReports({ kota, limit: 50 });

    res.json({
      success: true,
      total: rows.length,
      data: rows
    });

  } catch (error) {
    next(error);
  }
};
