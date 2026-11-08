const pool = require('../pool');

async function migrate() {
  try {
    console.log('Running migration: 20261108_create_klaim_table.js...');

    const ddl = `
      CREATE TABLE IF NOT EXISTS \`klaim_penukaran_poin\` (
        \`id_klaim\` INT NOT NULL AUTO_INCREMENT,
        \`kode_klaim\` VARCHAR(30) NOT NULL UNIQUE,
        \`id_warga\` INT NOT NULL,
        \`id_katalog\` INT NOT NULL,
        \`biaya_poin\` INT NOT NULL,
        \`nilai_rupiah\` VARCHAR(50) NOT NULL,
        \`status_klaim\` ENUM(
          'MENUNGGU_VERIFIKASI', 
          'DISETUJUI_SIAP_AMBIL', 
          'SELESAI_DISERAHKAN', 
          'DITOLAK_BATAL'
        ) NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
        \`catatan_admin\` TEXT NULL,
        \`tanggal_pengajuan\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`tanggal_verifikasi\` TIMESTAMP NULL,
        PRIMARY KEY (\`id_klaim\`),
        INDEX \`idx_klaim_warga\` (\`id_warga\`),
        INDEX \`idx_klaim_status\` (\`status_klaim\`),
        CONSTRAINT \`fk_klaim_warga\` FOREIGN KEY (\`id_warga\`) REFERENCES \`profiles_warga\` (\`id_warga\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_klaim_katalog\` FOREIGN KEY (\`id_katalog\`) REFERENCES \`katalog_penukaran\` (\`id_katalog\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.query(ddl);
    console.log('Table klaim_penukaran_poin created or already exists.');

    // Extend riwayat_poin enum to include REFUND_KLAIM
    await pool.query("ALTER TABLE riwayat_poin MODIFY COLUMN tipe ENUM('EARN_TRANSAKSI', 'REDEEM_REWARD', 'PENYESUAIAN_ADMIN', 'REFUND_KLAIM') NOT NULL");
    console.log('riwayat_poin enum altered to include REFUND_KLAIM.');

    // Seed 1 initial claim if empty
    const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM klaim_penukaran_poin');
    if (existing[0].cnt === 0) {
      await pool.query(`
        INSERT INTO \`klaim_penukaran_poin\` 
        (\`kode_klaim\`, \`id_warga\`, \`id_katalog\`, \`biaya_poin\`, \`nilai_rupiah\`, \`status_klaim\`, \`catatan_admin\`, \`tanggal_pengajuan\`)
        VALUES ('KLAIM-2611-B901', 1, 2, 100, 'Rp 20.000', 'MENUNGGU_VERIFIKASI', NULL, NOW() - INTERVAL 2 HOUR)
      `);
      console.log('Seeded sample pending claim KLAIM-2611-B901.');
    }

    // Set id_mitra of trx 2 to NULL so it can be claimed
    await pool.query('UPDATE transaksi_sampah_komersil SET id_mitra = NULL WHERE id_transaksi = 2 AND status = "MENUNGGU_PENJEMPUTAN"');
    console.log('Set TRX 2 id_mitra = NULL for task claiming demo.');

    const [desc] = await pool.query('DESCRIBE klaim_penukaran_poin');
    console.log('Structure of klaim_penukaran_poin:', desc.map(d => d.Field).join(', '));

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch(err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
