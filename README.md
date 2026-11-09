# 🌿 TrashManage — Sistem Pengelolaan Sampah & Bank Sampah Komunitas RT/RW

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.x-blue.svg)](https://react.dev/)
[![Database](https://img.shields.io/badge/database-MySQL%208.0%20%7C%20TiDB%20Serverless-orange.svg)](https://tidbcloud.com/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-3.4.x-sky.svg)](https://tailwindcss.com/)

**TrashManage** adalah platform sistem informasi tata kelola persampahan terpadu berbasis komunitas lingkungan rukun warga (RT/RW). Aplikasi ini mengintegrasikan pengaduan sampah liar secara transparan, penjemputan sampah anorganik terpilah oleh unit bank sampah, sistem insentif tabungan poin sembako warga, hingga pemantauan metrik dampak ekologis berdasarkan standar **Permen LHK No. 14 Tahun 2021**.

---

## 📌 Fitur Unggulan Sistem

### 1. Portal Warga (Eco-Citizen)
* **Pelaporan Sampah Liar Publik:** Pelaporan titik timbulan sampah liar tanpa harus login (bebas birokrasi), dilengkapi kompresi gambar otomatis di browser dan stempel watermark lokasi/waktu nyata.
* **Lacak Aduan Publik:** Pemantauan status penanganan tiket aduan (`LAPOR-XXXX-XXXX`) secara transparan beserta foto perbandingan sebelum (*before*) dan sesudah (*after*) pembersihan satgas.
* **Form Setor Sampah Terpilah:** Pengajuan penjemputan sampah anorganik (Plastik, Kertas/Kardus, Logam, Minyak Jelantah) ke rumah dengan konfirmasi kontak petugas.
* **Buku Tabungan Poin & Tukar Sembako:** Poin dari timbangan sampah dapat ditukarkan dengan komoditas sembako (Beras, Minyak Goreng, Gula) atau potongan iuran kas RT.
* **Voucher Digital & Struk Resmi:** Masing-masing transaksi dilengkapi kode QR voucher untuk klaim di Balai RT serta struk digital resmi bertanda tangan digital.
* **Filter Riwayat Cerdas:** Fitur penyaringan rentang waktu (*Semua Waktu*, *Bulan Ini*, *7 Hari Terakhir*) agar tampilan warga tidak menumpuk tanpa kehilangan riwayat buku besar.

### 2. Portal Petugas & Mitra Lapangan (Field Logistics)
* **Satgas Kebersihan Lapangan:** Penanganan titik sampah liar, pemilihan template catatan tindakan lapangan cepat, dan unggah foto transparansi lokasi steril.
* **Bank Sampah Unit RT/RW:** Pengambilan tugas penjemputan sampah ke rumah warga, penimbangan riil di tempat menggunakan timbangan gantung/digital, dan verifikasi perolehan poin otomatis ke saldo tabungan warga.
* **Mode Shift Kerja:** Dilengkapi filter rentang waktu agar petugas dapat fokus pada tugas harian/mingguan tanpa terganggu riwayat masa lalu.

### 3. Dasbor Administrator RW (Governance & KLHK Impact)
* **Sidebar Menu Modern:** Antarmuka manajerial responsif di sisi kiri untuk navigasi cepat.
* **Monitoring Bank Sampah:** Audit perputaran ekonomi sirkular komunitas, rekapitulasi tonase komoditas terpilah (Kg), peredaran poin, dan estimasi nilai rupiah sembako.
* **Kalkulator Dampak Ekologis KLHK:** Kalkulasi otomatis reduksi emisi gas buang karbon ($kg\ CO_2e$), diversi pengalihan sampah dari TPA, liter air bersih terlindungi dari minyak jelantah, dan serapan setara pohon produktif.
* **Validasi Klaim Sembako:** Otomasi persetujuan voucher sembako warga, pemotongan stok fisik di gudang balai RT secara *real-time*, serta pengembalian poin otomatis (*auto-refund*) jika klaim dibatalkan.
* **Manajemen Katalog Reward:** Kelola stok, poin penukaran, ikon, dan status tayang komoditas sembako.
* **Moderasi Akun:** Hak akses untuk mengaktifkan atau membekukan (*freeze*) akun pengguna.

---

## 🏗️ Arsitektur Teknologi

* **Frontend:** React 18, Vite, React Router DOM v6, Tailwind CSS, Lucide React Icons.
* **Backend:** Node.js, Express.js (Arsitektur Modular MVC, Restful API).
* **Keamanan:** JSON Web Token (JWT), `bcryptjs` password hashing, `helmet` security headers, strict CORS, RBAC Middleware (`warga`, `mitra`, `admin`).
* **Database:** MySQL 8.0 / MariaDB / TiDB Cloud Serverless (`mysql2/promise` connection pooling & TLS/SSL ready).
* **Media Storage:** Dual-engine storage (Penyimpanan lokal dengan proteksi direktori atau Cloudflare R2 / AWS S3 kompatibel).

---

## 📁 Struktur Direktori

```text
trash-management/
├── app.js                     # Inisialisasi Express & routing SPA fallback
├── package.json               # Dependensi Backend
├── Dockerfile                 # Konfigurasi container produksi (Alpine ultralight)
├── .env.example               # Template environment variables
├── bin/
│   └── www                    # HTTP server entrypoint
├── database/
│   ├── db_trash.sql           # Skema DDL master & seed data awal
│   ├── pool.js                # MySQL2 connection pool & SSL handler
│   └── migrations/            # Berkas migrasi skema tabel
├── public/
│   └── uploads/               # Direktori penyimpanan unggahan bukti foto lokal
├── src/
│   ├── config/                # Konfigurasi ENV & S3/R2 storage
│   ├── controllers/           # Logika bisnis (Auth, Warga, Mitra, Admin, Public)
│   ├── middleware/            # Auth JWT, RBAC, Multer upload handler
│   ├── models/                # Akses kueri database SQL
│   └── routes/                # Deklarasi endpoint RESTful API
└── frontend/                  # Aplikasi React + Vite
    ├── package.json           # Dependensi Frontend
    ├── vite.config.js         # Konfigurasi Vite & dev server proxy
    ├── tailwind.config.js     # Skema desain warna & tema Tailwind
    └── src/
        ├── api/client.js      # Klien HTTP fetch terpusat
        ├── components/        # Komponen UI (Navbar, Modals, Badge, QR)
        ├── context/           # AuthContext (state autentikasi global)
        ├── pages/             # Halaman Beranda, Setor, Lacak, Admin, Mitra
        └── utils/             # Kalkulator KLHK, kompresor gambar watermark
```

---

## 🚀 Panduan Inisialisasi & Instalasi Lokal

### Prasyarat Sistem
* [Node.js](https://nodejs.org/) versi `>= 20.x`
* [MySQL](https://www.mysql.com/) versi `>= 8.0` atau [Laragon](https://laragon.org/) / XAMPP lokal
* Git

---

### Langkah 1: Kloning Repositori
```bash
git clone https://github.com/Rahdansuwa24/trash-management.git
cd trash-management
```

### Langkah 2: Instalasi Dependensi Backend
```bash
npm install
```

### Langkah 3: Setup Basis Data MySQL
1. Pastikan server MySQL lokal Anda aktif (misal via Laragon atau XAMPP pada port `3306`).
2. Buat database baru bernama `db_trash`:
   ```sql
   CREATE DATABASE db_trash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Impor seluruh tabel dan data sampel dari file `database/db_trash.sql`:
   * **Via MySQL CLI:**
     ```bash
     mysql -u root -p db_trash < database/db_trash.sql
     ```
   * **Atau via phpMyAdmin / HeidiSQL:** Buka `db_trash`, pilih tab *Import*, lalu pilih file `database/db_trash.sql`.

### Langkah 4: Konfigurasi Environment Variable Backend
Salin file `.env.example` menjadi `.env` pada *root folder*:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi koneksi database Anda di `.env`:
```ini
PORT=3003
NODE_ENV=development

# Konfigurasi Database Lokal
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=db_trash
DB_SSL=false

# Keamanan JWT
JWT_SECRET=trash-management-dev-secret-key-2026
JWT_EXPIRES_IN=7d
```

### Langkah 5: Instalasi Dependensi Frontend
Buka terminal baru dan masuk ke folder `frontend`:
```bash
cd frontend
npm install
```

### Langkah 6: Menjalankan Aplikasi dalam Mode Pengembangan (Dev Mode)
* **Jalankan Backend (Terminal 1 di folder root):**
  ```bash
  npm run dev
  # Backend berjalan pada http://localhost:3003
  ```
* **Jalankan Frontend (Terminal 2 di folder frontend):**
  ```bash
  cd frontend
  npm run dev
  # Frontend berjalan pada http://localhost:5173
  ```
Buka browser Anda dan akses: **`http://localhost:5173`**.

---

## 👥 Akun Uji Coba Default (Demo Credentials)

Untuk memudahkan peninjauan fitur, sistem telah dilengkapi akun bawaan yang dapat langsung digunakan via tombol **"1-Klik Masuk Akun Uji"** di modal login atau menggunakan kredensial berikut:

| Peran | Email | Kata Sandi | Deskripsi Akses |
| :--- | :--- | :--- | :--- |
| **Administrator RW** | `admin@trashmanage.id` | `password123` | Akses penuh dashboard audit, KLHK, katalog, & moderasi akun |
| **Satgas Lapangan** | `petugas.rw05@trashmanage.id` | `password123` | Penanganan armada & investigasi titik sampah liar |
| **Bank Sampah RT 03**| `banksampah.rt03@trashmanage.id` | `password123` | Penjemputan & verifikasi timbangan sampah warga |
| **Warga Lingkungan** | `budi.santoso@warga.id` | `password123` | Pelaporan, setor sampah, saldo tabungan poin, & tukar sembako |

---

## 🌐 Panduan Deployment Produksi (100% Gratis Tanpa Kartu Kredit)

Arsitektur produksi terbaik yang efisien, berkinerja tinggi, dan bebas biaya:

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  Cloudflare Pages      │ ───> │  Render.com Web Service│ ───> │  TiDB Cloud Serverless │
│  (Frontend React + SSL)│      │  (Backend API Express) │      │  (Database MySQL 5 GB) │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

1. **Database:** Buat cluster gratis di [TiDB Cloud](https://tidbcloud.com) (Region Singapore `ap-southeast-1`), lalu impor `database/db_trash.sql`.
2. **Backend:** Hubungkan repository GitHub ini ke [Render](https://render.com), pilih *Web Service*, dan isi Environment Variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT=4000`, `DB_SSL=true`).
3. **Mencegah Server Tidur:** Daftarkan URL backend ke [cron-job.org](https://cron-job.org) atau UptimeRobot untuk mem-ping endpoint `GET /health` setiap 10 menit sekali.
4. **Frontend:** Hubungkan repository ke [Cloudflare Pages](https://pages.cloudflare.com), atur *Root directory* ke `frontend`, *Build command:* `npm run build`, dan *Output directory:* `dist`. Tambahkan environment variable `VITE_API_BASE_URL` mengarah ke URL backend Render Anda.

---

## 📄 Lisensi
Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE). Dikembangkan untuk kemajuan ekosistem lingkungan dan ekonomi sirkular masyarakat.
