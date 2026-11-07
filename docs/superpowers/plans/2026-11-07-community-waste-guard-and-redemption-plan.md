# Community Waste Route Guard & Point Redemption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menetapkan pembatasan hak akses (Route Guard & 403 Forbidden) di frontend, mendetailkan formulir pendaftaran warga berbasis perumahan RT/RW, dan menambahkan katalog penukaran tabungan poin di Bank Sampah.

**Architecture:** Menggunakan komponen guard wrapper React Router (`ProtectedRoute.jsx`) yang tersinkronisasi dengan `AuthContext`, halaman penolakan sopan (`Forbidden403.jsx`), pembaruan formulir modal registrasi dengan input blok/nomor rumah & RT/RW, dan penambahan kartu penukaran poin interaktif di `/setor`.

**Tech Stack:** React 18, React Router DOM v6, Tailwind CSS, Lucide React, Express.js (Node.js).

**Spec:** `docs/superpowers/specs/2026-11-07-community-waste-guard-and-redemption-design.md`

## Global Constraints
- Mengikuti antislop civic clean design (tanpa gradient ungu/neon, tanpa em dash, tap target minimal 44px).
- Tidak ada breaking changes pada API backend yang sudah berjalan.
- Menguji seluruh alur dengan build lokal Vite (`npm run build`).

## Review Focus
1. Pengguna anonim/tamu membuka `/admin` langsung via URL -> harus menampilkan 403 atau modal login, tidak boleh merender dashboard admin.
2. Pengguna dengan `role: warga` membuka `/mitra` -> harus menampilkan 403 Forbidden dengan pesan ramah khusus petugas, tidak boleh mengakses tugas satgas.
3. Warga baru mendaftar dengan blok rumah dan RT -> tersimpan di profil dan langsung login otomatis dengan saldo 0 poin.
4. Saldo poin di `/setor` terhubung dengan simulasi penukaran (iuran RT, sembako, kas).
5. Navigasi Navbar bersih, hanya menampilkan menu yang relevan dengan peran pengguna saat ini.

---

### Task 1: Buat Komponen `ProtectedRoute.jsx` dan `Forbidden403.jsx`

**Files:**
- Create: `frontend/src/components/ProtectedRoute.jsx`
- Create: `frontend/src/components/Forbidden403.jsx`

**Interfaces:**
- Consumes: `useAuth` dari `frontend/src/context/AuthContext.jsx`.
- Produces: `<ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>` yang merender children jika role cocok, memicu `setLoginModalOpen(true)` jika belum login, atau merender `<Forbidden403 />` jika role tidak berwenang.

- [ ] **Step 1: Buat file `frontend/src/components/Forbidden403.jsx`**
  Tampilan civic clean dengan ikon perisai gembok, pesan sopan: "Akses Terbatas: Halaman ini khusus untuk Pengurus Lingkungan / Petugas", dan tombol kembali ke Beranda atau ganti akun.

- [ ] **Step 2: Buat file `frontend/src/components/ProtectedRoute.jsx`**
  Memeriksa `loading`, `user`, dan apakah `allowedRoles.includes(user.role)`. Jika belum login, tampilkan fallback meminta login. Jika role salah, render `Forbidden403`.

- [ ] **Step 3: Verifikasi sintaks via node / build check**
  Jalankan verifikasi build di frontend.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/components/ProtectedRoute.jsx frontend/src/components/Forbidden403.jsx
  git commit -m "feat(auth): add ProtectedRoute guard and Forbidden403 component"
  ```

---

### Task 2: Pasang Route Guard di `App.jsx` & Saring Menu di `Navbar.jsx`

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Navbar.jsx`

**Interfaces:**
- Consumes: `ProtectedRoute` dari `frontend/src/components/ProtectedRoute.jsx` dan `useAuth`.
- Produces: Rute `/admin` dan `/mitra` yang terproteksi, serta menu navigasi yang kondisional berdasarkan role.

- [ ] **Step 1: Pasang `ProtectedRoute` pada rute `/admin` dan `/mitra` di `frontend/src/App.jsx`**
  - `/admin`: `allowedRoles={['admin']}`
  - `/mitra`: `allowedRoles={['mitra', 'admin']}`

- [ ] **Step 2: Perbarui `frontend/src/components/Navbar.jsx`**
  - Tampilkan menu "Admin" hanya jika `user?.role === 'admin'`.
  - Tampilkan menu "Portal Petugas" hanya jika `user?.role === 'mitra' || user?.role === 'admin'`.
  - Warga hanya melihat: Beranda, Lapor Sampah Liar, Lacak Aduan, Bank Sampah.

- [ ] **Step 3: Uji rute via build**
  Jalankan `npm run build` di folder frontend.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/App.jsx frontend/src/components/Navbar.jsx
  git commit -m "feat(routes): enforce role-based route guards and contextual navbar links"
  ```

---

### Task 3: Detailkan Formulir Registrasi Warga di `LoginModal.jsx`

**Files:**
- Modify: `frontend/src/components/LoginModal.jsx`

**Interfaces:**
- Consumes: `register` dari `useAuth()`.
- Produces: Input detail perumahan (Blok/Nomor Rumah, Pilihan RT 01-05, RW 05, No. WhatsApp).

- [ ] **Step 1: Perbarui state & formulir di `LoginModal.jsx`**
  - Ganti input alamat generik menjadi:
    * `blok_rumah`: "Contoh: Blok B4 No. 12"
    * `rt`: Dropdown pilihan RT 01, RT 02, RT 03, RT 04, RT 05.
    * `rw`: "RW 05 (Kalirungkut)" (terkunci/terstandarisasi).
    * `no_telp`: Nomor WhatsApp aktif.
  - Gabungkan menjadi alamat lengkap yang dikirim ke API backend saat submit.

- [ ] **Step 2: Uji registrasi di modal**
  Pastikan validasi input berjalan dengan mulus.

- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/components/LoginModal.jsx
  git commit -m "feat(auth): enrich citizen registration form with RT/RW housing fields"
  ```

---

### Task 4: Tambahkan Katalog Penukaran Poin Tabungan di `SetorSampah.jsx`

**Files:**
- Modify: `frontend/src/pages/SetorSampah.jsx`

**Interfaces:**
- Consumes: Saldo `pointsData.total_poin` dari API warga.
- Produces: Komponen showcase katalog penukaran tabungan lingkungan (Potong Iuran RT, Sembako Balai RT, Pencairan Kas Tunai) dengan indikator status kelayakan tukar.

- [ ] **Step 1: Tambahkan data & komponen Katalog Penukaran Poin di `SetorSampah.jsx`**
  - 3 Opsi Penukaran Nyata Komunitas:
    1. **Potongan Iuran Sampah & Keamanan RT:** Biaya 50 Poin (Nilai: Rp 10.000).
    2. **Minyak Goreng 1 Liter di Balai RT:** Biaya 100 Poin (Nilai: Rp 20.000).
    3. **Pencairan Kas Tabungan Tunai:** Kelipatan 50 Poin (Rp 10.000).
  - Setiap kartu menampilkan progress apakah poin warga saat ini mencukupi untuk ditukar.

- [ ] **Step 2: Uji interaksi UI**
  Pastikan responsif di mobile dan desktop.

- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/pages/SetorSampah.jsx
  git commit -m "feat(warga): add community waste points redemption showcase"
  ```

---

### Task 5: Verifikasi Akhir & Produksi Bundle

**Files:**
- Semua file terkait.

- [ ] **Step 1: Jalankan audit build frontend**
  Jalankan `npm run build` di folder `frontend/` dan pastikan 0 error.

- [ ] **Step 2: Verifikasi status git**
  Pastikan working tree bersih.
