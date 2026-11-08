const pool = require('../../database/pool');
const { uploadToR2 } = require('../config/s3');
const { LaporanModel, MitraModel, TransaksiModel, WargaModel } = require('../models');

exports.getAssignedReports = async (req, res, next) => {
  try {
    const { status, kota } = req.query;
    const rows = await LaporanModel.getAssignedReports({ status, kota, limit: 50 });
    res.json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.submitCleanupAction = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const idLaporan = req.params.id;
    const { keterangan_tindakan, status = 'DALAM_PENANGANAN' } = req.body;

    if (!keterangan_tindakan) {
      return res.status(400).json({
        success: false,
        message: 'Keterangan tindakan penanganan wajib diisi.'
      });
    }

    const report = await LaporanModel.findById(idLaporan, connection);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Data laporan tidak ditemukan.'
      });
    }

    // Identify partner ID
    let idMitra = req.user ? req.user.id_mitra : null;
    if (!idMitra && req.user && req.user.id_user) {
      const mitraProfile = await MitraModel.findByUserId(req.user.id_user, connection);
      if (mitraProfile) idMitra = mitraProfile.id_mitra;
    }
    // Fallback to default DLH Surabaya
    if (!idMitra) idMitra = 1;

    const fotoFile = req.file ||
      (Array.isArray(req.files)
        ? (req.files.find(f => f.fieldname === 'file_foto_tindakan' || f.fieldname === 'file_foto_bukti') || req.files[0])
        : (req.files?.file_foto_tindakan?.[0] || req.files?.file_foto_bukti?.[0])) || null;
    const fotoUrl = fotoFile ? await uploadToR2(fotoFile, 'cleanup-actions') : null;

    await connection.beginTransaction();

    // 1. Insert action progress log
    await MitraModel.addCleanupAction({
      id_laporan: idLaporan,
      id_mitra: idMitra,
      keterangan_tindakan,
      foto_bukti_penanganan_url: fotoUrl
    }, connection);

    // 2. Update status of the report
    await LaporanModel.updateStatusAndPartner(idLaporan, status, idMitra, connection);

    await connection.commit();

    res.json({
      success: true,
      message: 'Tindakan penanganan berhasil dicatat.',
      data: {
        id_laporan: idLaporan,
        status,
        keterangan: keterangan_tindakan,
        foto_bukti_penanganan_url: fotoUrl
      }
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

exports.getWasteBankPickups = async (req, res, next) => {
  try {
    const { status } = req.query;
    const rows = await TransaksiModel.getWasteBankPickups({ status, limit: 50 });
    res.json({
      success: true,
      total: rows.length,
      data: rows
    });

  } catch (error) {
    next(error);
  }
};

exports.claimPickup = async (req, res, next) => {
  try {
    const idTransaksi = req.params.id;

    let idMitra = req.user ? req.user.id_mitra : null;
    if (!idMitra && req.user && req.user.id_user) {
      const mitraProfile = await MitraModel.findByUserId(req.user.id_user);
      if (mitraProfile) idMitra = mitraProfile.id_mitra;
    }

    if (!idMitra) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Profil mitra petugas tidak ditemukan.'
      });
    }

    const trx = await TransaksiModel.findWithCategoryAndWarga(idTransaksi);
    if (!trx) {
      return res.status(404).json({
        success: false,
        message: 'Data penjemputan sampah tidak ditemukan.'
      });
    }

    if (trx.status !== 'MENUNGGU_PENJEMPUTAN') {
      return res.status(400).json({
        success: false,
        message: `Tugas penjemputan ini tidak dapat diklaim (status: ${trx.status}). Tugas mungkin sudah diambil oleh petugas lain.`
      });
    }

    const claimed = await TransaksiModel.claimPickup(idTransaksi, idMitra);
    if (!claimed) {
      return res.status(409).json({
        success: false,
        message: 'Tugas penjemputan ini baru saja diambil oleh petugas lain.'
      });
    }

    res.json({
      success: true,
      message: 'Tugas penjemputan berhasil Anda klaim. Warga sekarang dapat melihat identitas penjemput Anda.',
      data: {
        id_transaksi: idTransaksi,
        id_mitra: idMitra,
        status: 'DIKONFIRMASI_MITRA'
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.completeTransaction = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const idTransaksi = req.params.id;
    const { berat_aktual_kg, catatan_mitra } = req.body;

    const berat = parseFloat(berat_aktual_kg);
    if (isNaN(berat) || berat <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Berat aktual hasil timbangan wajib diisi angka lebih dari 0 kg.'
      });
    }

    const trx = await TransaksiModel.findWithCategoryAndWarga(idTransaksi, connection);

    if (!trx) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.'
      });
    }

    if (trx.status === 'SELESAI') {
      return res.status(400).json({
        success: false,
        message: 'Transaksi ini sudah selesai sebelumnya.'
      });
    }

    const finalPoints = Math.floor(berat * trx.poin_per_kg);

    let idMitra = req.user ? req.user.id_mitra : null;
    if (!idMitra && req.user && req.user.id_user) {
      const mitraProfile = await MitraModel.findByUserId(req.user.id_user, connection);
      if (mitraProfile) idMitra = mitraProfile.id_mitra;
    }
    if (!idMitra) idMitra = 2; // Default Bank Sampah Berkah

    await connection.beginTransaction();

    // 1. Update transaction
    await TransaksiModel.completeTransaction({
      id_transaksi: idTransaksi,
      berat_aktual_kg: berat,
      total_poin_diperoleh: finalPoints,
      id_mitra: idMitra,
      catatan_mitra: catatan_mitra || null
    }, connection);

    // 2. Credit points to citizen
    await WargaModel.addPoints(trx.id_warga, finalPoints, connection);

    // 3. Record in points ledger
    await WargaModel.addPointsLedger({
      id_warga: trx.id_warga,
      id_transaksi: idTransaksi,
      perubahan_poin: finalPoints,
      tipe: 'EARN_TRANSAKSI',
      keterangan: `Penukaran ${berat} Kg ${trx.nama_kategori} (${trx.kode_transaksi})`
    }, connection);

    await connection.commit();

    res.json({
      success: true,
      message: 'Transaksi penukaran sampah selesai diverifikasi dan poin telah dikreditkan ke warga.',
      data: {
        id_transaksi: idTransaksi,
        kode_transaksi: trx.kode_transaksi,
        berat_aktual_kg: berat,
        total_poin_diperoleh: finalPoints,
        status: 'SELESAI'
      }
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};
