const pool = require('../../database/pool');

class KatalogModel {
  static async getAll(db = pool) {
    const [rows] = await db.query(
      'SELECT id_katalog, kode_item, judul, biaya_poin, nilai_rupiah, kategori_badge, icon_name, deskripsi, stok, is_active, created_at, updated_at FROM katalog_penukaran ORDER BY id_katalog ASC'
    );
    return rows;
  }

  static async getActive(db = pool) {
    const [rows] = await db.query(
      'SELECT id_katalog, kode_item, judul, biaya_poin, nilai_rupiah, kategori_badge, icon_name, deskripsi, stok FROM katalog_penukaran WHERE is_active = 1 ORDER BY biaya_poin ASC'
    );
    return rows;
  }

  static async findById(idKatalog, db = pool) {
    const [rows] = await db.query('SELECT * FROM katalog_penukaran WHERE id_katalog = ?', [idKatalog]);
    return rows[0] || null;
  }

  static async findByIdWithLock(idKatalog, db) {
    const [rows] = await db.query(
      'SELECT id_katalog, judul, biaya_poin, nilai_rupiah, stok, is_active FROM katalog_penukaran WHERE id_katalog = ? FOR UPDATE',
      [idKatalog]
    );
    return rows[0] || null;
  }

  static async create({
    kode_item,
    judul,
    biaya_poin,
    nilai_rupiah,
    kategori_badge = 'Sembako',
    icon_name = 'ShoppingBag',
    deskripsi = '',
    stok = 50,
    is_active = 1
  }, db = pool) {
    const [result] = await db.query(
      'INSERT INTO katalog_penukaran (kode_item, judul, biaya_poin, nilai_rupiah, kategori_badge, icon_name, deskripsi, stok, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [kode_item, judul, biaya_poin, nilai_rupiah, kategori_badge, icon_name, deskripsi, stok, is_active]
    );
    return {
      id_katalog: result.insertId,
      kode_item,
      judul,
      biaya_poin,
      nilai_rupiah,
      kategori_badge,
      icon_name,
      deskripsi,
      stok,
      is_active
    };
  }

  static async update(idKatalog, {
    judul,
    biaya_poin,
    nilai_rupiah,
    kategori_badge,
    icon_name,
    deskripsi,
    stok,
    is_active
  }, db = pool) {
    const [result] = await db.query(
      'UPDATE katalog_penukaran SET judul = COALESCE(?, judul), biaya_poin = COALESCE(?, biaya_poin), nilai_rupiah = COALESCE(?, nilai_rupiah), kategori_badge = COALESCE(?, kategori_badge), icon_name = COALESCE(?, icon_name), deskripsi = COALESCE(?, deskripsi), stok = COALESCE(?, stok), is_active = COALESCE(?, is_active) WHERE id_katalog = ?',
      [
        judul !== undefined ? judul.trim() : null,
        biaya_poin !== undefined ? parseInt(biaya_poin, 10) : null,
        nilai_rupiah !== undefined ? nilai_rupiah.trim() : null,
        kategori_badge !== undefined ? kategori_badge.trim() : null,
        icon_name !== undefined ? icon_name.trim() : null,
        deskripsi !== undefined ? deskripsi.trim() : null,
        stok !== undefined && stok !== null ? parseInt(stok, 10) : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        idKatalog
      ]
    );
    return result.affectedRows > 0;
  }

  static async toggleStatus(idKatalog, db = pool) {
    await db.query(
      'UPDATE katalog_penukaran SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id_katalog = ?',
      [idKatalog]
    );
    const [rows] = await db.query('SELECT is_active FROM katalog_penukaran WHERE id_katalog = ?', [idKatalog]);
    return rows[0] ? rows[0].is_active : null;
  }

  static async decrementStock(idKatalog, amount = 1, db = pool) {
    const [result] = await db.query(
      'UPDATE katalog_penukaran SET stok = GREATEST(0, stok - ?) WHERE id_katalog = ?',
      [amount, idKatalog]
    );
    return result.affectedRows > 0;
  }

  static async deleteById(idKatalog, db = pool) {
    const [result] = await db.query('DELETE FROM katalog_penukaran WHERE id_katalog = ?', [idKatalog]);
    return result.affectedRows > 0;
  }
}

module.exports = KatalogModel;
