const pool = require('../../database/pool');
const { uploadToR2 } = require('../config/s3');
const crypto = require('crypto');
const { KatalogModel, TransaksiModel, WargaModel, KlaimModel } = require('../models');

function generateTransactionCode() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TRX-${year}${month}-${randomChars}`;
}

function generateClaimCode() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `KLAIM-${year}${month}-${randomChars}`;
}

exports.getCategories = async (req, res, next) => {
  try {
    const rows = await TransaksiModel.getCategories();
    res.json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const {
      id_kategori,
      estimasi_berat_kg,
      alamat_jemput,
      rt = '03',
      rw = '05',
      kota,
      kecamatan,
      latitude,
      longitude,
      catatan_warga,
      id_mitra
    } = req.body;

    if (!id_kategori || !estimasi_berat_kg || !alamat_jemput || !kota || !kecamatan) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi kategori, estimasi berat, alamat jemput, kota, dan kecamatan.'
      });
    }

    const berat = parseFloat(estimasi_berat_kg);
    if (isNaN(berat) || berat <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Estimasi berat harus berupa angka lebih besar dari 0 kg.'
      });
    }

    // Verify category exists
    const category = await TransaksiModel.findCategoryById(id_kategori);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori sampah tidak ditemukan atau tidak aktif.'
      });
    }
    const estimatedPoints = Math.floor(berat * category.poin_per_kg);

    // Identify citizen profile from authenticated user
    if (req.user && (req.user.role === 'mitra' || req.user.role === 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Pengajuan setor sampah khusus untuk akun warga lingkungan. Petugas dan admin tidak dapat mengajukan setoran.'
      });
    }

    let idWarga = null;
    if (req.user && req.user.id_user) {
      const wargaProfile = await WargaModel.findByUserId(req.user.id_user);
      if (wargaProfile) {
        idWarga = wargaProfile.id_warga;
      }
    }

    if (!idWarga) {
      return res.status(401).json({
        success: false,
        message: 'Silakan masuk (login) dengan akun warga lingkungan RT/RW untuk menyetorkan sampah dan menabung poin.'
      });
    }

    const fotoFile = req.file || (req.files && req.files.file_foto ? req.files.file_foto[0] : null);
    const fotoUrl = fotoFile ? await uploadToR2(fotoFile, 'waste-bank') : null;

    let kodeTrx = generateTransactionCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const exists = await TransaksiModel.transactionCodeExists(kodeTrx);
      if (!exists) {
        isUnique = true;
      } else {
        kodeTrx = generateTransactionCode();
        attempts++;
      }
    }

    const createdTrx = await TransaksiModel.create({
      kode_transaksi: kodeTrx,
      id_warga: idWarga,
      id_mitra: id_mitra || null,
      id_kategori,
      estimasi_berat_kg: berat,
      total_poin_diperoleh: estimatedPoints,
      foto_sampah_url: fotoUrl,
      alamat_jemput,
      rt,
      rw,
      kota,
      kecamatan,
      latitude,
      longitude,
      catatan_warga,
      status: 'MENUNGGU_PENJEMPUTAN'
    });

    res.status(201).json({
      success: true,
      message: 'Pengajuan setor sampah berhasil dibuat. Petugas bank sampah unit akan menjadwalkan penimbangan.',
      kode_transaksi: kodeTrx,
      data: {
        id_transaksi: createdTrx.id_transaksi,
        kode_transaksi: kodeTrx,
        kategori: category.nama_kategori,
        estimasi_berat_kg: berat,
        estimasi_poin: estimatedPoints,
        status: 'MENUNGGU_PENJEMPUTAN'
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getMyTransactions = async (req, res, next) => {
  try {
    let idWarga = null;

    if (req.user && req.user.id_user) {
      const profile = await WargaModel.findByUserId(req.user.id_user);
      if (profile) idWarga = profile.id_warga;
    }

    if (!idWarga) {
      return res.json({
        success: true,
        total: 0,
        data: []
      });
    }

    const rows = await TransaksiModel.findByCitizen(idWarga);

    res.json({
      success: true,
      total: rows.length,
      data: rows
    });

  } catch (error) {
    next(error);
  }
};

exports.getPointsAndHistory = async (req, res, next) => {
  try {
    let idWarga = null;
    if (req.user && req.user.id_user) {
      const profile = await WargaModel.findByUserId(req.user.id_user);
      if (profile) idWarga = profile.id_warga;
    }

    if (!idWarga) {
      return res.json({
        success: true,
        data: {
          total_poin: 0,
          history: []
        }
      });
    }

    const totalPoin = await WargaModel.getPoints(idWarga);
    const historyRows = await WargaModel.getPointsHistory(idWarga, 20);

    res.json({
      success: true,
      data: {
        total_poin: totalPoin,
        history: historyRows
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getKatalog = async (req, res, next) => {
  try {
    const rows = await KatalogModel.getActive();
    res.json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.claimReward = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    if (!req.user || req.user.role !== 'warga') {
      return res.status(403).json({
        success: false,
        message: 'Penukaran poin tabungan daur ulang hanya diperuntukkan bagi akun warga lingkungan.'
      });
    }

    const { id_katalog } = req.body;
    if (!id_katalog) {
      return res.status(400).json({
        success: false,
        message: 'ID item katalog penukaran wajib disertakan.'
      });
    }

    await connection.beginTransaction();

    // 1. Ambil profil warga dengan row-level lock
    const warga = await WargaModel.findByUserIdWithLock(req.user.id_user, connection);

    if (!warga) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Profil data warga tidak ditemukan.'
      });
    }

    // 2. Ambil item katalog dengan lock
    const item = await KatalogModel.findByIdWithLock(id_katalog, connection);

    if (!item || !item.is_active) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item penukaran tidak ditemukan atau sedang tidak aktif.'
      });
    }

    if (item.stok <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Stok untuk item "${item.judul}" saat ini sedang habis.`
      });
    }

    if (warga.total_poin < item.biaya_poin) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Saldo poin Anda (${warga.total_poin} Poin) belum mencukupi untuk klaim ${item.judul} (${item.biaya_poin} Poin).`
      });
    }

    // 3. Potong saldo poin warga (stok fisik dipotong saat serah terima oleh pengurus/admin)
    const newTotalPoin = warga.total_poin - item.biaya_poin;
    await WargaModel.updatePoints(warga.id_warga, newTotalPoin, connection);

    // 4. Generate unique claim code
    let kodeKlaim = generateClaimCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const exists = await KlaimModel.claimCodeExists(kodeKlaim, connection);
      if (!exists) {
        isUnique = true;
      } else {
        kodeKlaim = generateClaimCode();
        attempts++;
      }
    }

    // 5. Catat pengajuan klaim ke tabel klaim_penukaran_poin
    const createdClaim = await KlaimModel.create({
      kode_klaim: kodeKlaim,
      id_warga: warga.id_warga,
      id_katalog: item.id_katalog,
      biaya_poin: item.biaya_poin,
      nilai_rupiah: item.nilai_rupiah,
      status_klaim: 'MENUNGGU_VERIFIKASI'
    }, connection);

    // 6. Catat mutasi penukaran ke buku besar riwayat_poin
    const keterangan = `Klaim Voucher ${item.judul} (${kodeKlaim})`;
    const historyResult = await WargaModel.addPointsLedger({
      id_warga: warga.id_warga,
      id_transaksi: null,
      perubahan_poin: -item.biaya_poin,
      tipe: 'REDEEM_REWARD',
      keterangan
    }, connection);

    await connection.commit();

    res.json({
      success: true,
      message: `Berhasil mengajukan penukaran ${item.biaya_poin} Poin dengan ${item.judul}! Tunjukkan kode klaim ke pengurus Balai RT saat pengambilan.`,
      data: {
        id_klaim: createdClaim.id_klaim,
        kode_klaim: kodeKlaim,
        id_riwayat: historyResult.id_riwayat,
        id_katalog: item.id_katalog,
        judul: item.judul,
        biaya_poin: item.biaya_poin,
        nilai_rupiah: item.nilai_rupiah,
        status_klaim: 'MENUNGGU_VERIFIKASI',
        sisa_poin: newTotalPoin,
        keterangan
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Aliased for backward compatibility
exports.redeemReward = exports.claimReward;

exports.getMyClaims = async (req, res, next) => {
  try {
    let idWarga = null;
    if (req.user && req.user.id_user) {
      const profile = await WargaModel.findByUserId(req.user.id_user);
      if (profile) idWarga = profile.id_warga;
    }

    if (!idWarga) {
      return res.json({
        success: true,
        total: 0,
        data: []
      });
    }

    const claims = await KlaimModel.findByCitizen(idWarga);
    res.json({
      success: true,
      total: claims.length,
      data: claims
    });
  } catch (error) {
    next(error);
  }
};

exports.simulationAddPoints = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'warga') {
      return res.status(403).json({
        success: false,
        message: 'Simulasi suntik poin hanya untuk pengujian akun warga.'
      });
    }

    const profile = await WargaModel.findByUserId(req.user.id_user);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil warga tidak ditemukan.'
      });
    }

    const { poin = 100 } = req.body;
    const poinToAdd = parseInt(poin, 10) || 100;

    await WargaModel.addPoints(profile.id_warga, poinToAdd);
    await WargaModel.addPointsLedger({
      id_warga: profile.id_warga,
      id_transaksi: null,
      perubahan_poin: poinToAdd,
      tipe: 'EARN_TRANSAKSI',
      keterangan: `Simulasi Sandbox Pengujian (+${poinToAdd} Poin Uji Coba)`
    });

    const newTotal = await WargaModel.getPoints(profile.id_warga);

    res.json({
      success: true,
      message: `Berhasil menambahkan +${poinToAdd} poin simulasi pengujian untuk demo fitur.`,
      data: {
        total_poin: newTotal,
        added_poin: poinToAdd
      }
    });
  } catch (error) {
    next(error);
  }
};
