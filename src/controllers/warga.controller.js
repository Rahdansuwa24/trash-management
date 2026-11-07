const pool = require('../../database/pool');
const { uploadToR2 } = require('../config/s3');
const crypto = require('crypto');

function generateTransactionCode() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TRX-${year}${month}-${randomChars}`;
}

exports.getCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_kategori, nama_kategori, poin_per_kg, estimasi_harga_per_kg, deskripsi FROM kategori_sampah WHERE is_active = 1 ORDER BY id_kategori ASC'
    );
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
    const [catRows] = await pool.query('SELECT poin_per_kg, nama_kategori FROM kategori_sampah WHERE id_kategori = ? AND is_active = 1', [id_kategori]);
    if (catRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori sampah tidak ditemukan atau tidak aktif.'
      });
    }
    const category = catRows[0];
    const estimatedPoints = Math.floor(berat * category.poin_per_kg);

    // Identify citizen profile
    let idWarga = null;
    if (req.user && req.user.id_user) {
      const [wargaRows] = await pool.query('SELECT id_warga FROM profiles_warga WHERE id_user = ?', [req.user.id_user]);
      if (wargaRows.length > 0) {
        idWarga = wargaRows[0].id_warga;
      }
    }

    // Fallback to demo citizen if unauthenticated (demo mode)
    if (!idWarga) {
      const [defaultWarga] = await pool.query('SELECT id_warga FROM profiles_warga LIMIT 1');
      idWarga = defaultWarga.length > 0 ? defaultWarga[0].id_warga : 1;
    }

    const fotoFile = req.file || (req.files && req.files.file_foto ? req.files.file_foto[0] : null);
    const fotoUrl = fotoFile ? await uploadToR2(fotoFile, 'waste-bank') : null;

    let kodeTrx = generateTransactionCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const [existing] = await pool.query('SELECT id_transaksi FROM transaksi_sampah_komersil WHERE kode_transaksi = ?', [kodeTrx]);
      if (existing.length === 0) {
        isUnique = true;
      } else {
        kodeTrx = generateTransactionCode();
        attempts++;
      }
    }

    const insertSql = `
      INSERT INTO transaksi_sampah_komersil 
      (kode_transaksi, id_warga, id_mitra, id_kategori, estimasi_berat_kg, total_poin_diperoleh, foto_sampah_url, alamat_jemput, kota, kecamatan, latitude, longitude, catatan_warga, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MENUNGGU_PENJEMPUTAN')
    `;

    const [result] = await pool.query(insertSql, [
      kodeTrx,
      idWarga,
      id_mitra || null,
      id_kategori,
      berat,
      estimatedPoints,
      fotoUrl,
      alamat_jemput,
      kota,
      kecamatan,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      catatan_warga || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Pengajuan setor sampah berhasil dibuat. Bank Sampah / Pengepul akan memverifikasi jadwal penjemputan.',
      kode_transaksi: kodeTrx,
      data: {
        id_transaksi: result.insertId,
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
    let idWarga = req.user ? req.user.id_warga : null;

    if (!idWarga && req.user && req.user.id_user) {
      const [wRows] = await pool.query('SELECT id_warga FROM profiles_warga WHERE id_user = ?', [req.user.id_user]);
      if (wRows.length > 0) idWarga = wRows[0].id_warga;
    }

    // Fallback to demo citizen
    if (!idWarga) idWarga = 1;

    const sql = `
      SELECT 
        t.id_transaksi,
        t.kode_transaksi,
        k.nama_kategori,
        t.estimasi_berat_kg,
        t.berat_aktual_kg,
        t.total_poin_diperoleh,
        t.foto_sampah_url,
        t.alamat_jemput,
        t.status,
        t.tanggal_transaksi,
        t.tanggal_selesai,
        m.instansi_nama AS nama_mitra
      FROM transaksi_sampah_komersil t
      JOIN kategori_sampah k ON t.id_kategori = k.id_kategori
      LEFT JOIN profiles_mitra m ON t.id_mitra = m.id_mitra
      WHERE t.id_warga = ?
      ORDER BY t.tanggal_transaksi DESC
    `;

    const [rows] = await pool.query(sql, [idWarga]);

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
    let idWarga = req.user ? req.user.id_warga : null;
    if (!idWarga && req.user && req.user.id_user) {
      const [wRows] = await pool.query('SELECT id_warga FROM profiles_warga WHERE id_user = ?', [req.user.id_user]);
      if (wRows.length > 0) idWarga = wRows[0].id_warga;
    }
    if (!idWarga) idWarga = 1;

    const [profileRows] = await pool.query('SELECT total_poin FROM profiles_warga WHERE id_warga = ?', [idWarga]);
    const totalPoin = profileRows.length > 0 ? profileRows[0].total_poin : 0;

    const [historyRows] = await pool.query(
      'SELECT id_riwayat, perubahan_poin, tipe, keterangan, created_at FROM riwayat_poin WHERE id_warga = ? ORDER BY created_at DESC LIMIT 20',
      [idWarga]
    );

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
