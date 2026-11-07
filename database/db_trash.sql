-- ==============================================================================
-- DDL & SEED DATA: db_trash (TiDB Cloud Serverless / MySQL 8.0)
-- Proyek: Trash Management (Smart City & Circular Economy Hub)
-- Tanggal: 2026-11-07
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabel: users (Akun Login & RBAC)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id_user` INT NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'warga', 'mitra') NOT NULL DEFAULT 'warga',
  `status` ENUM('active', 'frozen', 'blocked') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_user`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel: profiles_warga (Profil Tambahan Warga & Akumulasi Poin)
DROP TABLE IF EXISTS `profiles_warga`;
CREATE TABLE `profiles_warga` (
  `id_warga` INT NOT NULL AUTO_INCREMENT,
  `id_user` INT NOT NULL UNIQUE,
  `jenis_kelamin` ENUM('L', 'P') NULL,
  `no_telp` VARCHAR(20) NULL,
  `alamat` TEXT NULL,
  `provinsi` VARCHAR(100) NULL,
  `kota` VARCHAR(100) NULL,
  `kecamatan` VARCHAR(100) NULL,
  `kelurahan` VARCHAR(100) NULL,
  `total_poin` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_warga`),
  CONSTRAINT `fk_warga_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel: profiles_mitra (Profil Mitra Pemerintah [DLH] & Non-Pemerintah [Bank Sampah])
DROP TABLE IF EXISTS `profiles_mitra`;
CREATE TABLE `profiles_mitra` (
  `id_mitra` INT NOT NULL AUTO_INCREMENT,
  `id_user` INT NOT NULL UNIQUE,
  `jenis_mitra` ENUM('pemerintah', 'non-pemerintah') NOT NULL,
  `instansi_nama` VARCHAR(150) NOT NULL,
  `no_telp` VARCHAR(20) NULL,
  `alamat` TEXT NULL,
  `provinsi` VARCHAR(100) NULL,
  `kota` VARCHAR(100) NOT NULL,
  `kecamatan` VARCHAR(100) NOT NULL,
  `kelurahan` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mitra`),
  INDEX `idx_mitra_kota_jenis` (`kota`, `jenis_mitra`),
  CONSTRAINT `fk_mitra_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel: kategori_sampah (Master Kategori Bank Sampah & Nilai Tukar Poin)
DROP TABLE IF EXISTS `kategori_sampah`;
CREATE TABLE `kategori_sampah` (
  `id_kategori` INT NOT NULL AUTO_INCREMENT,
  `nama_kategori` VARCHAR(100) NOT NULL,
  `poin_per_kg` INT NOT NULL DEFAULT 10,
  `estimasi_harga_per_kg` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `deskripsi` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel: transaksi_sampah_komersil (Setor / Jual Sampah ke Mitra Bank Sampah)
DROP TABLE IF EXISTS `transaksi_sampah_komersil`;
CREATE TABLE `transaksi_sampah_komersil` (
  `id_transaksi` INT NOT NULL AUTO_INCREMENT,
  `kode_transaksi` VARCHAR(30) NOT NULL UNIQUE,
  `id_warga` INT NOT NULL,
  `id_mitra` INT NULL,
  `id_kategori` INT NOT NULL,
  `estimasi_berat_kg` DECIMAL(6,2) NOT NULL,
  `berat_aktual_kg` DECIMAL(6,2) NULL,
  `total_poin_diperoleh` INT NOT NULL DEFAULT 0,
  `foto_sampah_url` VARCHAR(255) NULL,
  `alamat_jemput` TEXT NOT NULL,
  `kota` VARCHAR(100) NOT NULL,
  `kecamatan` VARCHAR(100) NOT NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `catatan_warga` TEXT NULL,
  `catatan_mitra` TEXT NULL,
  `status` ENUM('MENUNGGU_PENJEMPUTAN', 'DIKONFIRMASI_MITRA', 'SELESAI', 'DIBATALKAN') NOT NULL DEFAULT 'MENUNGGU_PENJEMPUTAN',
  `tanggal_transaksi` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tanggal_selesai` TIMESTAMP NULL,
  PRIMARY KEY (`id_transaksi`),
  INDEX `idx_transaksi_kode` (`kode_transaksi`),
  INDEX `idx_transaksi_status` (`status`),
  CONSTRAINT `fk_transaksi_warga` FOREIGN KEY (`id_warga`) REFERENCES `profiles_warga` (`id_warga`) ON DELETE CASCADE,
  CONSTRAINT `fk_transaksi_mitra` FOREIGN KEY (`id_mitra`) REFERENCES `profiles_mitra` (`id_mitra`) ON DELETE SET NULL,
  CONSTRAINT `fk_transaksi_kategori` FOREIGN KEY (`id_kategori`) REFERENCES `kategori_sampah` (`id_kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel: riwayat_poin (Buku Besar Mutasi Poin Warga)
DROP TABLE IF EXISTS `riwayat_poin`;
CREATE TABLE `riwayat_poin` (
  `id_riwayat` INT NOT NULL AUTO_INCREMENT,
  `id_warga` INT NOT NULL,
  `id_transaksi` INT NULL,
  `perubahan_poin` INT NOT NULL,
  `tipe` ENUM('EARN_TRANSAKSI', 'REDEEM_REWARD', 'PENYESUAIAN_ADMIN') NOT NULL,
  `keterangan` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_riwayat`),
  INDEX `idx_riwayat_warga` (`id_warga`),
  CONSTRAINT `fk_riwayat_warga` FOREIGN KEY (`id_warga`) REFERENCES `profiles_warga` (`id_warga`) ON DELETE CASCADE,
  CONSTRAINT `fk_riwayat_transaksi` FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi_sampah_komersil` (`id_transaksi`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel: laporan_sampah_ilegal (Pelaporan Publik Sampah Liar / TPA Ilegal)
DROP TABLE IF EXISTS `laporan_sampah_ilegal`;
CREATE TABLE `laporan_sampah_ilegal` (
  `id_laporan` INT NOT NULL AUTO_INCREMENT,
  `kode_tiket` VARCHAR(30) NOT NULL UNIQUE,
  `id_user` INT NULL,
  `id_mitra_penangan` INT NULL,
  `nama_pelapor` VARCHAR(100) NOT NULL DEFAULT 'Warga Anonim',
  `nomor_kontak` VARCHAR(20) NOT NULL,
  `client_device_id` VARCHAR(100) NULL,
  `deskripsi_kejadian` TEXT NOT NULL,
  `foto_bukti_url` VARCHAR(255) NOT NULL,
  `video_bukti_url` VARCHAR(255) NULL,
  `alamat_lokasi` TEXT NOT NULL,
  `kota` VARCHAR(100) NOT NULL,
  `kecamatan` VARCHAR(100) NOT NULL,
  `kelurahan` VARCHAR(100) NULL,
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `status` ENUM('MENUNGGU_VERIFIKASI', 'INVESTIGASI', 'DALAM_PENANGANAN', 'SELESAI_DIBERSIHKAN', 'DITOLAK') NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_laporan`),
  INDEX `idx_laporan_kode_tiket` (`kode_tiket`),
  INDEX `idx_laporan_status` (`status`),
  INDEX `idx_laporan_kota` (`kota`),
  CONSTRAINT `fk_laporan_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE SET NULL,
  CONSTRAINT `fk_laporan_mitra_penangan` FOREIGN KEY (`id_mitra_penangan`) REFERENCES `profiles_mitra` (`id_mitra`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel: tindak_lanjut_aduan (Log Penanganan oleh DLH + Foto Bukti Bersih)
DROP TABLE IF EXISTS `tindak_lanjut_aduan`;
CREATE TABLE `tindak_lanjut_aduan` (
  `id_tindak_lanjut` INT NOT NULL AUTO_INCREMENT,
  `id_laporan` INT NOT NULL,
  `id_mitra` INT NOT NULL,
  `keterangan_tindakan` TEXT NOT NULL,
  `foto_bukti_penanganan_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_tindak_lanjut`),
  INDEX `idx_tindak_lanjut_laporan` (`id_laporan`),
  CONSTRAINT `fk_tindak_lanjut_laporan` FOREIGN KEY (`id_laporan`) REFERENCES `laporan_sampah_ilegal` (`id_laporan`) ON DELETE CASCADE,
  CONSTRAINT `fk_tindak_lanjut_mitra` FOREIGN KEY (`id_mitra`) REFERENCES `profiles_mitra` (`id_mitra`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel: aduan_pelanggaran_akun (Moderasi Akun Fiktif / Spammer oleh Admin)
DROP TABLE IF EXISTS `aduan_pelanggaran_akun`;
CREATE TABLE `aduan_pelanggaran_akun` (
  `id_pelanggaran` INT NOT NULL AUTO_INCREMENT,
  `id_pelapor_user` INT NOT NULL,
  `id_terlapor_user` INT NULL,
  `terlapor_device_id` VARCHAR(100) NULL,
  `jenis_pelaporan` ENUM('KOMERSIL_PALSU', 'ADUAN_LIAR_FIKTIF', 'PERILAKU_BURUK', 'LAINNYA') NOT NULL,
  `alasan` TEXT NOT NULL,
  `bukti_url` VARCHAR(255) NULL,
  `status_review` ENUM('PENDING', 'DITINJAU_ADMIN', 'DISANKSI', 'DITOLAK') NOT NULL DEFAULT 'PENDING',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pelanggaran`),
  CONSTRAINT `fk_pelanggaran_pelapor` FOREIGN KEY (`id_pelapor_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE,
  CONSTRAINT `fk_pelanggaran_terlapor` FOREIGN KEY (`id_terlapor_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- INITIAL SEED DATA (Siap Pakai untuk Uji Testing)
-- Password Default Seluruh Akun: Password123!
-- Hash: $2a$10$1Xa7Mr7bEiMesQG.dLE/zu9ebmz.NgQ8lLpoOL8LOsl6DkitM7TbK
-- ==============================================================================

-- 1. Seed Master Kategori Sampah
INSERT INTO `kategori_sampah` (`id_kategori`, `nama_kategori`, `poin_per_kg`, `estimasi_harga_per_kg`, `deskripsi`, `is_active`) VALUES
(1, 'Plastik (PET/HDPE)', 15, 3000.00, 'Botol plastik bening, galon bekas, tutup botol, kemasan deterjen tebal.', 1),
(2, 'Kertas & Kardus', 10, 2000.00, 'Kardus cokelat, kertas koran, buku bekas tanpa cover plastik.', 1),
(3, 'Logam & Besi/Aluminium', 25, 5000.00, 'Kaleng minuman aluminium, paku, seng, rongsok logam besi.', 1),
(4, 'Minyak Jelantah', 20, 4000.00, 'Minyak goreng bekas pakai rumah tangga yang telah disaring (per liter).', 1),
(5, 'Sampah Elektronik (E-Waste)', 50, 10000.00, 'Motherboard lama, charger rusak, kabel rongsok, komponen elektronik kecil.', 1);

-- 2. Seed Users
INSERT INTO `users` (`id_user`, `nama`, `email`, `password`, `role`, `status`) VALUES
(1, 'Pengurus Lingkungan (Koordinator RW 05)', 'admin@trashmanage.com', '$2a$10$1Xa7Mr7bEiMesQG.dLE/zu9ebmz.NgQ8lLpoOL8LOsl6DkitM7TbK', 'admin', 'active'),
(2, 'Petugas Lapangan Kebersihan RW 05', 'petugas.rw05@trashmanage.com', '$2a$10$1Xa7Mr7bEiMesQG.dLE/zu9ebmz.NgQ8lLpoOL8LOsl6DkitM7TbK', 'mitra', 'active'),
(3, 'Bank Sampah Unit Guyub Rukun RT 03', 'banksampah.rt03@trashmanage.com', '$2a$10$1Xa7Mr7bEiMesQG.dLE/zu9ebmz.NgQ8lLpoOL8LOsl6DkitM7TbK', 'mitra', 'active'),
(4, 'Budi Santoso (Warga RT 03)', 'warga.budi@trashmanage.com', '$2a$10$1Xa7Mr7bEiMesQG.dLE/zu9ebmz.NgQ8lLpoOL8LOsl6DkitM7TbK', 'warga', 'active');

-- 3. Seed Profiles
INSERT INTO `profiles_warga` (`id_warga`, `id_user`, `jenis_kelamin`, `no_telp`, `alamat`, `provinsi`, `kota`, `kecamatan`, `kelurahan`, `total_poin`) VALUES
(1, 4, 'L', '081234567890', 'Jl. Kenanga No. 14, RT 03 / RW 05', 'Jawa Timur', 'Surabaya', 'Rungkut', 'Kalirungkut', 150);

INSERT INTO `profiles_mitra` (`id_mitra`, `id_user`, `jenis_mitra`, `instansi_nama`, `no_telp`, `alamat`, `provinsi`, `kota`, `kecamatan`, `kelurahan`) VALUES
(1, 2, 'non-pemerintah', 'Tim Satgas Kebersihan RW 05', '081233445566', 'Posko Kebersihan RW 05', 'Jawa Timur', 'Surabaya', 'Rungkut', 'Kalirungkut'),
(2, 3, 'non-pemerintah', 'Bank Sampah Unit Guyub Rukun RT 03', '085678901234', 'Balai RT 03 Kalirungkut', 'Jawa Timur', 'Surabaya', 'Rungkut', 'Kalirungkut');

-- 4. Seed Contoh Transaksi Bank Sampah
INSERT INTO `transaksi_sampah_komersil` (`id_transaksi`, `kode_transaksi`, `id_warga`, `id_mitra`, `id_kategori`, `estimasi_berat_kg`, `berat_aktual_kg`, `total_poin_diperoleh`, `foto_sampah_url`, `alamat_jemput`, `kota`, `kecamatan`, `status`) VALUES
(1, 'TRX-202611-001', 1, 2, 1, 10.00, 10.00, 150, 'https://placehold.co/600x400/png?text=Botol+Plastik', 'Jl. Kenanga No. 14, RT 03 / RW 05', 'Surabaya', 'Rungkut', 'SELESAI');

INSERT INTO `riwayat_poin` (`id_warga`, `id_transaksi`, `perubahan_poin`, `tipe`, `keterangan`) VALUES
(1, 1, 150, 'EARN_TRANSAKSI', 'Penukaran 10 Kg Botol Plastik PET di Bank Sampah Unit Guyub Rukun RT 03');

-- 5. Seed Contoh Laporan Sampah Liar Publik (Siap Dicoba dengan Kode Tiket)
INSERT INTO `laporan_sampah_ilegal` (`id_laporan`, `kode_tiket`, `id_user`, `id_mitra_penangan`, `nama_pelapor`, `nomor_kontak`, `client_device_id`, `deskripsi_kejadian`, `foto_bukti_url`, `alamat_lokasi`, `kota`, `kecamatan`, `latitude`, `longitude`, `status`) VALUES
(1, 'LAPOR-2611-8921', NULL, 1, 'Andi (Warga)', '081987654321', 'device-demo-uuid-1234', 'Tumpukan sampah plastik liar di dekat pintu air RT 03.', 'https://placehold.co/600x400/png?text=Tumpukan+Sampah+Liar', 'Jl. Kenanga samping selokan RT 03', 'Surabaya', 'Rungkut', -7.31820000, 112.78450000, 'DALAM_PENANGANAN');

INSERT INTO `tindak_lanjut_aduan` (`id_laporan`, `id_mitra`, `keterangan_tindakan`, `foto_bukti_penanganan_url`) VALUES
(1, 1, 'Petugas kebersihan RW 05 telah menjadwalkan gerobak pengangkut untuk pembersihan sore ini.', 'https://placehold.co/600x400/png?text=Petugas+Menuju+Lokasi');
