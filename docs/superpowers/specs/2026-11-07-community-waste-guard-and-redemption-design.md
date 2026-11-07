# Design Specification: Fiksasi Hak Akses, Registrasi Warga RT/RW, dan Tabungan Poin

- **Status:** Proposed (Menunggu Konfirmasi User)
- **Tanggal:** 2026-11-07
- **Ruang Lingkup:** Trash Management (Sistem Pengelolaan Sampah Komunitas RT/RW)

---

## 1. Latar Belakang & Tujuan (Why & Intent)
Berdasarkan tinjauan arsitektur dan diskusi produk, aplikasi TrashManage disepakati beroperasi pada skala **Kawasan Komunitas / Perumahan Mandiri (Tingkat RW 05)**. 

Tujuan implementasi ini adalah:
1. Memastikan tidak ada kebocoran hak akses di antarmuka frontend melalui **Route Guard & RBAC (Role-Based Access Control)** yang ketat.
2. Memperjelas dan mendetailkan formulir pendaftaran warga dengan entitas perumahan nyata (Blok Rumah, RT 01-05, RW 05, No. WhatsApp).
3. Memberikan tujuan konkret pada fitur poin sebagai **Buku Tabungan Daur Ulang Warga**, lengkap dengan katalog penukaran realistis (Potongan Iuran Kebersihan RT, Sembako Balai RT, Pencairan Kas).

---

## 2. Sasaran & Batasan (Goals, Non-Goals, Anti-Goals)

### Goals
* **Route Protection:** Rute `/admin` hanya bisa dibuka oleh akun ber-role `admin`. Rute `/mitra` hanya bisa dibuka oleh akun ber-role `mitra`. Pengguna tanpa wewenang akan melihat halaman penolakan sopan (403 Forbidden Civic Notice) dengan tombol kembali.
* **Detailed Citizen Registration:** Formulir registrasi warga meminta: Nama Lengkap, Email, Password, No. WhatsApp, Blok / Nomor Rumah (contoh: *Blok B No. 14*), Pilihan RT (dropdown RT 01 s/d RT 05), dan RW 05.
* **Point Redemption Catalog (Katalog Penukaran Poin):** Menampilkan opsi riil penukaran poin di halaman Bank Sampah (`/setor`), seperti:
  1. Potongan Iuran Kebersihan & Keamanan RT (50 Poin = Rp 10.000).
  2. Paket Sembako / Minyak Goreng 1L di Balai RT (100 Poin = Rp 20.000).
  3. Pencairan Kas Tabungan Sampah (Kelipatan 50 Poin).

### Non-Goals
* Mengintegrasikan payment gateway perbankan nyata (misal Midtrans/Xendit) untuk transfer uang rupiah, karena penukaran poin di tingkat RT/RW diselesaikan secara manual oleh bendahara lingkungan / balai warga.
* Mengharuskan upload dokumen KTP asli fisik saat registrasi (cukup verifikasi domisili alamat rumah dan nomor WhatsApp agar warga tidak terbebani privasi).

### Anti-Goals
* Tidak membiarkan halaman Admin atau Portal Petugas dapat dibuka oleh tamu publik tanpa login.
* Tidak menampilkan angka poin tanpa kejelasan nilai riil dan kegunaannya.

---

## 3. Pendekatan yang Dipilih (Selected Approach)

* **Pendekatan yang Dipilih:** Opsi A (Buku Tabungan Daur Ulang Komunitas dengan Poin & Katalog Penukaran).
* **Alasan:** Menjaga keunggulan teknis portofolio dalam menangani arsitektur transaksional (*ledger/accounting*) dan memberikan use-case yang paling grounded bagi lingkungan perumahan warga di Indonesia.

---

## 4. Rincian Teknis Perubahan

### A. Komponen Baru: `ProtectedRoute.jsx` & `Forbidden403.jsx`
* Menjaga rute di `App.jsx`:
  * `<Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />`
  * `<Route path="/mitra" element={<ProtectedRoute allowedRoles={['mitra', 'admin']}><PortalMitra /></ProtectedRoute>} />`
* Jika belum login -> Buka otomatis Login Modal.
* Jika sudah login tapi role salah -> Tampilkan halaman 403 Forbidden dengan pesan: *"Halaman ini khusus untuk Petugas/Pengurus RW. Anda sedang masuk sebagai Warga."*

### B. Pembaruan `LoginModal.jsx` (Registrasi Detail Warga)
* Menambahkan input terstruktur:
  * Blok & Nomor Rumah (Text)
  * Pilihan Wilayah RT (Dropdown: RT 01, RT 02, RT 03, RT 04, RT 05)
  * RW (Readonly: RW 05 Kalirungkut)
  * No. WhatsApp aktif

### C. Pembaruan `SetorSampah.jsx` (Katalog Penukaran Poin)
* Menambahkan kartu interaktif **"Tukar Poin Tabungan Lingkungan"** di bawah saldo poin.
* Warga dapat melihat simulasi penukaran iuran RT atau sembako yang memotivasi mereka untuk terus memilah sampah.

### D. Penyelarasan Navigasi di `Navbar.jsx`
* Menu "Portal Petugas" dan "Admin" hanya dimunculkan jika akun yang login memiliki hak akses yang bersangkutan, sehingga navigasi warga tetap bersih dan fokus pada layanan mereka.
