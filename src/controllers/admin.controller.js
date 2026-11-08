const { UserModel, KatalogModel } = require('../models');

exports.getUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    const users = await UserModel.findUsers({ role, status, limit: 100 });
    res.json({
      success: true,
      total: users.length,
      data: users
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

    await UserModel.updateStatus(idUser, status);

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
    const stats = await UserModel.getPlatformStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

exports.getKatalog = async (req, res, next) => {
  try {
    const rows = await KatalogModel.getAll();
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
    const createdItem = await KatalogModel.create({
      kode_item: kodeItem,
      judul: judul.trim(),
      biaya_poin: parseInt(biaya_poin, 10),
      nilai_rupiah: nilai_rupiah.trim(),
      kategori_badge: kategori_badge ? kategori_badge.trim() : 'Sembako',
      icon_name: icon_name ? icon_name.trim() : 'ShoppingBag',
      deskripsi: deskripsi ? deskripsi.trim() : '',
      stok: stok ? parseInt(stok, 10) : 50,
      is_active: 1
    });

    res.status(201).json({
      success: true,
      message: 'Item katalog penukaran berhasil ditambahkan.',
      data: createdItem
    });
  } catch (error) {
    next(error);
  }
};

exports.updateKatalog = async (req, res, next) => {
  try {
    const idKatalog = req.params.id;
    const { judul, biaya_poin, nilai_rupiah, kategori_badge, icon_name, deskripsi, stok, is_active } = req.body;

    await KatalogModel.update(idKatalog, {
      judul,
      biaya_poin,
      nilai_rupiah,
      kategori_badge,
      icon_name,
      deskripsi,
      stok,
      is_active
    });

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
    const newStatus = await KatalogModel.toggleStatus(idKatalog);

    res.json({
      success: true,
      message: 'Status tayang item katalog berhasil diperbarui.',
      data: { id_katalog: idKatalog, is_active: newStatus }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteKatalog = async (req, res, next) => {
  try {
    const idKatalog = req.params.id;
    await KatalogModel.deleteById(idKatalog);

    res.json({
      success: true,
      message: 'Item katalog penukaran berhasil dihapus.'
    });
  } catch (error) {
    next(error);
  }
};
