# Design Specification: Civic Logistics Dispatch, Point Redemption Validation, and Credibility Pack

**Document ID:** `SPEC-2026-11-08-CIVIC-LOGISTICS-REWARD-APPROVAL`  
**Date:** 2026-11-08  
**Scope:** `trash-management` (Komunitas Paguyuban RT/RW & Bank Sampah Unit RW 05 Kalirungkut)  
**Status:** Approved for Planning  

---

## 1. Context & Motivation

Aplikasi Trash Management telah memiliki pemisahan peran (RBAC) yang bersih antara Warga (penyetor), Mitra (satgas/bank sampah unit), dan Admin RW (pengawas). Namun, untuk memiliki kredibilitas teknis dan operasional yang tinggi di hadapan penguji/rekruter (*bukan sekadar CRUD pencatatan biasa*), sistem memerlukan:
1. **Logistik Penjemputan Berbasis Lokasi & Task Claiming (Dispatching):** Petugas bank sampah unit dapat mengambil/mengklaim tugas penjemputan warga di wilayah zonanya, sehingga warga dapat melacak identitas petugas yang menjemput secara transparan.
2. **Alur Klaim & Validasi Penukaran Poin Dua Arah (Two-Step Redemption & Admin Approval):** Warga mengajukan penukaran poin &rarr; Admin/Bendahara memvalidasi & menyetujui klaim &rarr; Stok fisik berkurang saat barang diserahkan di Balai RT &rarr; Warga memegang voucher digital dengan QR Code.
3. **Sandbox / Simulasi Demo Pengujian:** Fitur suntik saldo poin uji coba agar reviewer/penguji dapat langsung mendemokan penukaran sembako seketika.
4. **Paket Kredibilitas Ilmiah & Integritas Bukti:**
   - *Automated GPS & Timestamp Watermarking* pada foto bukti lapangan via Canvas.
   - *Kalkulator Dampak Ekologis KLHK* (\(\text{kg CO}_2\text{e}\), liter air bersih terselamatkan).
   - *Digital Receipt (Struk Penimbangan Resmi)* dengan QR verifikasi siap cetak/PDF.

---

## 2. Arsitektur & Model Data

### 2.1. Tabel Baru: `klaim_penukaran_poin`
```sql
CREATE TABLE IF NOT EXISTS `klaim_penukaran_poin` (
  `id_klaim` INT NOT NULL AUTO_INCREMENT,
  `kode_klaim` VARCHAR(30) NOT NULL UNIQUE,
  `id_warga` INT NOT NULL,
  `id_katalog` INT NOT NULL,
  `biaya_poin` INT NOT NULL,
  `nilai_rupiah` VARCHAR(50) NOT NULL,
  `status_klaim` ENUM(
    'MENUNGGU_VERIFIKASI', 
    'DISETUJUI_SIAP_AMBIL', 
    'SELESAI_DISERAHKAN', 
    'DITOLAK_BATAL'
  ) NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
  `catatan_admin` TEXT NULL,
  `tanggal_pengajuan` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tanggal_verifikasi` TIMESTAMP NULL,
  PRIMARY KEY (`id_klaim`),
  INDEX `idx_klaim_warga` (`id_warga`),
  INDEX `idx_klaim_status` (`status_klaim`),
  CONSTRAINT `fk_klaim_warga` FOREIGN KEY (`id_warga`) REFERENCES `profiles_warga` (`id_warga`) ON DELETE CASCADE,
  CONSTRAINT `fk_klaim_katalog` FOREIGN KEY (`id_katalog`) REFERENCES `katalog_penukaran` (`id_katalog`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2. Pembaruan Status Alur Penjemputan (`transaksi_sampah_komersil`)
- `MENUNGGU_PENJEMPUTAN`: Warga mengajukan jadwal setor sampah. `id_mitra` masih `NULL`.
- `DIKONFIRMASI_MITRA`: Petugas mengklaim tugas (`id_mitra` terisi akun petugas). Warga melihat nama petugas & nomor kontak.
- `SELESAI`: Petugas tiba, menimbang fisik sampah (`berat_aktual_kg`), menerbitkan poin dan struk digital resmi.
- `DIBATALKAN`: Dibatalkan oleh warga atau petugas dengan alasan jelas.

---

## 3. Alur Kerja Pengguna (User Workflows)

### Alur A: Logistik Penjemputan & Tracking Real-time
```mermaid
sequenceDiagram
    autonumber
    actor W as Warga RT 03
    participant App as Frontend Warga
    participant API as Backend Server
    participant DB as Database (MySQL)
    actor M as Petugas Bank Sampah RT 03

    W->>App: Ajukan Setor Sampah (kategori, estimasi kg, alamat, foto GPS)
    App->>API: POST /api/warga/transactions
    API->>DB: INSERT transaksi (status: MENUNGGU_PENJEMPUTAN, id_mitra: NULL)
    M->>API: GET /api/mitra/pickups
    API-->>M: Daftar antrean di wilayah tugas (RW 05)
    M->>API: PUT /api/mitra/pickups/:id/claim
    API->>DB: UPDATE transaksi SET id_mitra=M.id, status='DIKONFIRMASI_MITRA'
    W->>App: Buka Tracking Setoran
    App-->>W: Menampilkan: "Petugas Penjemput: Bank Sampah Unit RT 03 (Pak Joko)"
    M->>API: PUT /api/mitra/transactions/:id/complete (berat_aktual_kg)
    API->>DB: UPDATE transaksi status='SELESAI', kredit total_poin warga
    API-->>W: Notifikasi Poin Masuk + Tombol Struk Timbangan Digital
```

### Alur B: Penukaran Poin & Validasi Admin
```mermaid
sequenceDiagram
    autonumber
    actor W as Warga Lingkungan
    participant API as Backend Server
    participant DB as Database
    actor A as Admin RW / Bendahara

    W->>API: POST /api/warga/katalog/claim (id_katalog)
    Note over API,DB: Transaksi ACID: Cek saldo & kunci stok
    API->>DB: Potong poin warga, INSERT klaim_penukaran_poin (MENUNGGU_VERIFIKASI)
    API-->>W: Tiket Klaim Digital Terbit (KLAIM-2611-XXXX + QR Code)
    A->>API: GET /api/admin/claims
    API-->>A: Daftar klaim masuk warga
    alt Setujui & Siapkan Barang
        A->>API: PUT /api/admin/claims/:id/verify (DISETUJUI_SIAP_AMBIL)
        API-->>W: Status Berubah: "Siap Diambil di Balai RT"
        A->>API: PUT /api/admin/claims/:id/verify (SELESAI_DISERAHKAN)
        API->>DB: Kurangi stok fisik di katalog_penukaran
    else Tolak & Kembalikan Poin
        A->>API: PUT /api/admin/claims/:id/verify (DITOLAK_BATAL)
        API->>DB: Refund poin warga ke profiles_warga & catat riwayat_poin
    end
```

---

## 4. Paket Fitur Kredibilitas

1. **Watermarking Canvas:**
   Fungsi `compressAndWatermarkImage()` mencetak banner transparan gelap di bagian bawah foto dengan teks monospaced putih:
   `TRASHMANAGE FIELD INSPECTION | [LAT, LNG] | [TIMESTAMP WIB] | RT 03 / RW 05`
2. **Kalkulator Ilmiah KLHK:**
   - Reduksi Emisi: \( \text{Berat (kg)} \times 2.15 = \dots \text{ kg CO}_2\text{e} \)
   - Penyelamatan Air Tanah: \( \text{Liter Minyak Jelantah} \times 1.000 = \dots \text{ Liter Air Bersih} \)
   - Diversi TPA: \( \frac{\text{Kg Terdaur Ulang}}{\text{Estimasi Timbulan}} \times 100\% \)
3. **Struk Timbangan Digital (Nota PDF):**
   - Komponen modal pop-up yang merender format nota kasir/bank sampah resmi ber-QR Code dengan tombol `Cetak / Unduh PDF`.
4. **Simulasi Pengujian Cepat:**
   - Tombol pengujian di modal warga: `+100 Poin Uji Coba` untuk memudahkan reviewer/penguji mendemokan fitur tanpa menunggu transaksi fisik.
