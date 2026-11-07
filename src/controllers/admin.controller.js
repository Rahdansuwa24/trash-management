const pool = require('../../database/pool');

exports.getUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    let sql = 'SELECT id_user, nama, email, role, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY id_user DESC LIMIT 100';

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

exports.updateUserStatus = async (req, res, next) => {
  try {
    const idUser = req.params.id;
    const { status } = req.body;

    if (!['active', 'frozen', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus salah satu dari: active, frozen, atau blocked.'
      });
    }

    await pool.query('UPDATE users SET status = ? WHERE id_user = ?', [status, idUser]);

    res.json({
      success: true,
      message: `Status pengguna berhasil diperbarui menjadi ${status}.`,
      data: { id_user: idUser, status }
    });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const [[userCount]] = await pool.query('SELECT COUNT(*) AS total_users FROM users');
    const [[reportCount]] = await pool.query('SELECT COUNT(*) AS total_reports FROM laporan_sampah_ilegal');
    const [[resolvedCount]] = await pool.query('SELECT COUNT(*) AS resolved_reports FROM laporan_sampah_ilegal WHERE status = "SELESAI_DIBERSIHKAN"');
    const [[trxStats]] = await pool.query('SELECT COUNT(*) AS total_trx, COALESCE(SUM(berat_aktual_kg), 0) AS total_kg, COALESCE(SUM(total_poin_diperoleh), 0) AS total_points FROM transaksi_sampah_komersil WHERE status = "SELESAI"');

    res.json({
      success: true,
      data: {
        total_users: userCount.total_users,
        total_reports: reportCount.total_reports,
        resolved_reports: resolvedCount.resolved_reports,
        total_waste_recycled_kg: parseFloat(trxStats.total_kg),
        total_points_distributed: parseInt(trxStats.total_points, 10),
        total_transactions: trxStats.total_trx
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getKatalog = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_katalog, kode_item, judul, biaya_poin, nilai_rupiah, kategori_badge, icon_name, deskripsi, stok, is_active, created_at, updated_at FROM katalog_penukaran ORDER BY id_katalog ASC'
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

exports.createKatalog = async (req, res, next) => {
  try {
    const { judul, biaya_poin, nilai_rupiah, kategori_badge, icon_name, deskripsi, stok } = req.body;
    if (!judul || !biaya_poin || !nilai_rupiah) {
      return res.status(400).json({
        success: false,
        message: 'Judul, biaya poin, dan nilai rupiah wajib diisi.'
      });
    }

    const kodeItem = 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const [result] = await pool.query(
      'INSERT INTO katalog_penukaran (kode_item, judul, biaya_poin, nilai_rupiah, kategori_badge, icon_name, deskripsi, stok, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [
        kodeItem,
        judul.trim(),
        parseInt(biaya_poin, 10),
        nilai_rupiah.trim(),
        kategori_badge ? kategori_badge.trim() : 'Sembako',
        icon_name ? icon_name.trim() : 'ShoppingBag',
        deskripsi ? deskripsi.trim() : '',
        stok ? parseInt(stok, 10) : 50
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Item katalog penukaran berhasil ditambahkan.',
      data: {
        id_katalog: result.insertId,
        kode_item: kodeItem,
        judul,
        biaya_poin: parseInt(biaya_poin, 10),
        nilai_rupiah,
        kategori_badge: kategori_badge || 'Sembako',
        icon_name: icon_name || 'ShoppingBag',
        deskripsi: deskripsi || '',
        stok: stok ? parseInt(stok, 10) : 50,
        is_active: 1
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateKatalog = async (req, res, next) => {
  try {
    const idKatalog = req.params.id;
    const { judul, biaya_poin, nilai_rupiah, kategori_badge, icon_name, deskripsi, stok, is_active } = req.body;

    await pool.query(
      'UPDATE katalog_penukaran SET judul = COALESCE(?, judul), biaya_poin = COALESCE(?, biaya_poin), nilai_rupiah = COALESCE(?, nilai_rupiah), kategori_badge = COALESCE(?, kategori_badge), icon_name = COALESCE(?, icon_name), deskripsi = COALESCE(?, deskripsi), stok = COALESCE(?, stok), is_active = COALESCE(?, is_active) WHERE id_katalog = ?',
      [
        judul ? judul.trim() : null,
        biaya_poin ? parseInt(biaya_poin, 10) : null,
        nilai_rupiah ? nilai_rupiah.trim() : null,
        kategori_badge ? kategori_badge.trim() : null,
        icon_name ? icon_name.trim() : null,
        deskripsi !== undefined ? deskripsi.trim() : null,
        stok !== undefined && stok !== null ? parseInt(stok, 10) : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        idKatalog
      ]
    );

    res.json({
      success: true,
      message: 'Item katalog penukaran berhasil diperbarui.'
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleKatalogStatus = async (req, res, next) => {
  try {
    const idKatalog = req.params.id;
    await pool.query(
      'UPDATE katalog_penukaran SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id_katalog = ?',
      [idKatalog]
    );

    const [[updated]] = await pool.query('SELECT is_active FROM katalog_penukaran WHERE id_katalog = ?', [idKatalog]);

    res.json({
      success: true,
      message: 'Status tayang item katalog berhasil diperbarui.',
      data: { id_katalog: idKatalog, is_active: updated ? updated.is_active : null }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteKatalog = async (req, res, next) => {
  try {
    const idKatalog = req.params.id;
    await pool.query('DELETE FROM katalog_penukaran WHERE id_katalog = ?', [idKatalog]);

    res.json({
      success: true,
      message: 'Item katalog penukaran berhasil dihapus.'
    });
  } catch (error) {
    next(error);
  }
};

