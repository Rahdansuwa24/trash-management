const pool = require('../../database/pool');
const { uploadToR2 } = require('../config/s3');

exports.getAssignedReports = async (req, res, next) => {
  try {
    const { status, kota } = req.query;
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

    sql += ' ORDER BY l.created_at DESC LIMIT 50';

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

    const [reports] = await connection.query('SELECT id_laporan, id_mitra_penangan FROM laporan_sampah_ilegal WHERE id_laporan = ?', [idLaporan]);
    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data laporan tidak ditemukan.'
      });
    }

    // Identify partner ID
    let idMitra = req.user ? req.user.id_mitra : null;
    if (!idMitra && req.user && req.user.id_user) {
      const [mRows] = await connection.query('SELECT id_mitra FROM profiles_mitra WHERE id_user = ?', [req.user.id_user]);
      if (mRows.length > 0) idMitra = mRows[0].id_mitra;
    }
    // Fallback to default DLH Surabaya
    if (!idMitra) idMitra = 1;

    const fotoFile = req.file || (req.files && req.files.file_foto_tindakan ? req.files.file_foto_tindakan[0] : null);
    const fotoUrl = fotoFile ? await uploadToR2(fotoFile, 'cleanup-actions') : null;

    await connection.beginTransaction();

    // 1. Insert action progress log
    await connection.query(
      'INSERT INTO tindak_lanjut_aduan (id_laporan, id_mitra, keterangan_tindakan, foto_bukti_penanganan_url) VALUES (?, ?, ?, ?)',
      [idLaporan, idMitra, keterangan_tindakan, fotoUrl]
    );

    // 2. Update status of the report
    await connection.query(
      'UPDATE laporan_sampah_ilegal SET status = ?, id_mitra_penangan = ? WHERE id_laporan = ?',
      [status, idMitra, idLaporan]
    );

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
    let sql = `
      SELECT 
        t.id_transaksi,
        t.kode_transaksi,
        w.id_warga,
        u.nama AS nama_warga,
        w.no_telp AS kontak_warga,
        k.nama_kategori,
        t.estimasi_berat_kg,
        t.berat_aktual_kg,
        t.total_poin_diperoleh,
        t.alamat_jemput,
        t.kota,
        t.kecamatan,
        t.status,
        t.foto_sampah_url,
        t.tanggal_transaksi
      FROM transaksi_sampah_komersil t
      JOIN profiles_warga w ON t.id_warga = w.id_warga
      JOIN users u ON w.id_user = u.id_user
      JOIN kategori_sampah k ON t.id_kategori = k.id_kategori
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY t.tanggal_transaksi DESC LIMIT 50';

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

    const [trxRows] = await connection.query(
      `SELECT t.*, k.poin_per_kg, k.nama_kategori, w.id_warga 
       FROM transaksi_sampah_komersil t
       JOIN kategori_sampah k ON t.id_kategori = k.id_kategori
       JOIN profiles_warga w ON t.id_warga = w.id_warga
       WHERE t.id_transaksi = ?`,
      [idTransaksi]
    );

    if (trxRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.'
      });
    }

    const trx = trxRows[0];
    if (trx.status === 'SELESAI') {
      return res.status(400).json({
        success: false,
        message: 'Transaksi ini sudah selesai sebelumnya.'
      });
    }

    const finalPoints = Math.floor(berat * trx.poin_per_kg);

    let idMitra = req.user ? req.user.id_mitra : null;
    if (!idMitra && req.user && req.user.id_user) {
      const [mRows] = await connection.query('SELECT id_mitra FROM profiles_mitra WHERE id_user = ?', [req.user.id_user]);
      if (mRows.length > 0) idMitra = mRows[0].id_mitra;
    }
    if (!idMitra) idMitra = 2; // Default Bank Sampah Berkah

    await connection.beginTransaction();

    // 1. Update transaction
    await connection.query(
      `UPDATE transaksi_sampah_komersil 
       SET status = 'SELESAI', berat_aktual_kg = ?, total_poin_diperoleh = ?, id_mitra = ?, catatan_mitra = ?, tanggal_selesai = NOW()
       WHERE id_transaksi = ?`,
      [berat, finalPoints, idMitra, catatan_mitra || null, idTransaksi]
    );

    // 2. Credit points to citizen
    await connection.query(
      'UPDATE profiles_warga SET total_poin = total_poin + ? WHERE id_warga = ?',
      [finalPoints, trx.id_warga]
    );

    // 3. Record in points ledger
    await connection.query(
      `INSERT INTO riwayat_poin (id_warga, id_transaksi, perubahan_poin, tipe, keterangan)
       VALUES (?, ?, ?, 'EARN_TRANSAKSI', ?)`,
      [trx.id_warga, idTransaksi, finalPoints, `Penukaran ${berat} Kg ${trx.nama_kategori} (${trx.kode_transaksi})`]
    );

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
