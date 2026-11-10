# Panduan & Rencana Implementasi DuckDNS + HTTPS SSL Otomatis

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghubungkan domain gratis dari DuckDNS ke Azure VM (`70.153.84.218`) dan mengaktifkan sertifikat SSL resmi Let's Encrypt (HTTPS gembok hijau) secara otomatis, sehingga fitur web sensitif (GPS Geolocation akurasi tinggi dan akses kamera HP) berjalan dengan izin penuh browser.

**Architecture:** 
- **DNS:** DuckDNS Dynamic DNS mengarahkan subdomain `<nama-pilihan>.duckdns.org` ke IP Publik Azure VM `70.153.84.218`.
- **Reverse Proxy & Auto-SSL:** Caddy Server container berjalan di depan container `trash-backend`, otomatis menangani tantangan TLS ACME Let's Encrypt pada port 80 & 443, mengelola pembaruan sertifikat otomatis (*auto-renewal* seumur hidup), dan mem-proxy traffic HTTPS secara aman ke backend Express di port 3003.
- **Backend & Frontend:** Express.js + React SPA berjalan di container internal, menyajikan aplikasi secara terpadu tanpa warning keamanan browser.

**Tech Stack:** DuckDNS API, Caddy 2 (Alpine Docker), Docker Compose, Let's Encrypt TLS/SSL, Azure NSG Inbound Security Rules.

---

## Global Constraints

- **Platform:** Ubuntu Azure VM (`70.153.84.218`), Docker & Docker Compose.
- **Port:** Port 80 (HTTP ACME challenge & HTTP->HTTPS redirect) dan Port 443 (HTTPS TLS) wajib dibuka di Azure Network Security Group (NSG).
- **SSL Certificate:** Otomatis diterbitkan oleh Let's Encrypt via Caddy tanpa konfigurasi sertifikat manual.
- **Memory Overhead:** Caddy hanya mengonsumsi sekitar 15-25 MB RAM, sangat aman untuk kapasitas VM Azure.

---

## Review Focus & Failure Modes

1. **Port 80/443 Terblokir Azure Firewall:** Caddy gagal menerbitkan sertifikat Let's Encrypt jika port 80 tertutup dari luar.
   - *Solusi:* Verifikasi aturan inbound port 80 dan 443 di Azure Portal sebelum menjalankan Caddy.
2. **Subdomain DuckDNS Belum Mengarah ke IP VM:** Verifikasi dengan `ping <subdomain>.duckdns.org` untuk memastikan DNS sudah mengembalikan `70.153.84.218`.
3. **Port 3003 Conflict:** Caddy mem-proxy ke nama service Docker `trash-backend:3003` di dalam docker network yang sama sehingga port 3003 tidak perlu lagi diexpose langsung ke publik jika ingin lebih aman (opsional tetap dibuka sebagai fallback).

---

### Task 1: Daftarkan Subdomain di DuckDNS

**Tujuan:** Mendapatkan nama domain gratis yang Anda tentukan sendiri dan mengarahkannya ke IP Publik Azure VM.

- [ ] **Step 1: Buka DuckDNS**
  Kunjungi situs resmi: **[https://www.duckdns.org](https://www.duckdns.org)**.
- [ ] **Step 2: Login Akun**
  Klik tombol login di pojok kanan atas menggunakan akun **Google** atau **GitHub** Anda.
- [ ] **Step 3: Tentukan Nama Domain Anda**
  Di bagian **domains**:
  - Masukkan nama yang Anda inginkan (misalnya: `trashmanage`, `banksampah-rungkut`, `surabaya-bersih`, atau nama pilihan Anda).
  - Klik tombol **"add domain"**.
  - Domain Anda akan menjadi: `https://<nama-pilihan>.duckdns.org`.
- [ ] **Step 4: Arahkan ke IP VM Azure**
  - Pada baris domain yang baru dibuat, di kolom **current ip**, masukkan IP Publik Azure VM Anda:
    `70.153.84.218`
  - Klik tombol **"update ip"**.
- [ ] **Step 5: Verifikasi DNS**
  Buka terminal lokal Anda dan lakukan tes ping:
  ```bash
  ping <nama-pilihan>.duckdns.org
  ```
  Pastikan IP yang muncul adalah `70.153.84.218`.

---

### Task 2: Buka Port 80 & 443 di Azure Portal (Network Security Group)

**Tujuan:** Memberikan izin traffic HTTP dan HTTPS masuk dari internet ke Azure VM agar Let's Encrypt dapat memverifikasi kepemilikan domain dan browser dapat mengakses web secara aman.

- [ ] **Step 1: Buka Portal Azure**
  Masuk ke **[https://portal.azure.com](https://portal.azure.com)**.
- [ ] **Step 2: Navigasi ke Virtual Machine**
  Pilih VM Anda (`vm-axon-sales4`) -> Pilih menu **Networking** (atau **Network settings**).
- [ ] **Step 3: Tambahkan Inbound Port Rule untuk Port 80 & 443**
  Klik **"Add inbound port rule"**:
  - **Source:** `Any`
  - **Source port ranges:** `*`
  - **Destination:** `Any`
  - **Service:** `Custom` (atau pilih HTTP dan HTTPS)
  - **Destination port ranges:** `80, 443`
  - **Protocol:** `TCP`
  - **Action:** `Allow`
  - **Priority:** `350` (atau angka yang belum dipakai, misal di bawah 360)
  - **Name:** `Allow-HTTP-HTTPS`
  - Klik **"Add"**.

---

### Task 3: Konfigurasi Caddy Reverse Proxy & Docker Compose

**Files:**
- Create: `Caddyfile`
- Modify: `docker-compose.yml`
- Modify: `app.js` (aktifkan kembali HSTS & security headers untuk HTTPS)

- [ ] **Step 1: Buat berkas `Caddyfile` di root project**
  ```caddyfile
  {$DOMAIN:localhost} {
      reverse_proxy trash-backend:3003
      encode gzip zstd
  }
  ```
- [ ] **Step 2: Perbarui `docker-compose.yml` untuk menambahkan Caddy container**
  ```yaml
  services:
    trash-backend:
      build:
        context: .
        dockerfile: Dockerfile
      container_name: trash-backend
      restart: unless-stopped
      ports:
        - "3003:3003"
      env_file:
        - .env
      volumes:
        - ./public/uploads:/app/public/uploads

    caddy:
      image: caddy:2-alpine
      container_name: trash-caddy
      restart: unless-stopped
      ports:
        - "80:80"
        - "443:443"
      environment:
        - DOMAIN=${DOMAIN:-trashmanage.duckdns.org}
      volumes:
        - ./Caddyfile:/etc/caddy/Caddyfile:ro
        - caddy_data:/data
        - caddy_config:/config
      depends_on:
        - trash-backend

  volumes:
    caddy_data:
    caddy_config:
  ```
- [ ] **Step 3: Tambahkan variabel `DOMAIN` di file `.env` di Azure VM**
  ```env
  DOMAIN=nama-domain-anda.duckdns.org
  ```

---

### Task 4: Eksekusi Deployment di Azure VM & Verifikasi SSL

- [ ] **Step 1: Tarik perubahan kode terbaru di VM**
  ```bash
  cd ~/trash-management
  git pull origin master
  ```
- [ ] **Step 2: Pasang variabel DOMAIN di `.env` VM**
  ```bash
  echo "DOMAIN=nama-domain-anda.duckdns.org" >> .env
  ```
- [ ] **Step 3: Jalankan Docker Compose dengan Caddy**
  ```bash
  docker compose up -d --build
  ```
- [ ] **Step 4: Pantau log penerbitan sertifikat SSL Caddy**
  ```bash
  docker logs -f trash-caddy
  ```
  *Caddy akan otomatis menghubungi Let's Encrypt, menerbitkan sertifikat HTTPS, dan mengaktifkan gembok hijau.*
- [ ] **Step 5: Verifikasi di Browser**
  Buka: `https://<nama-domain-anda>.duckdns.org`.
  - Ikon gembok hijau aman (*Connection is secure*) aktif.
  - Form Lapor Sampah Liar dapat mendeteksi GPS koordinat presisi tinggi tanpa blokir browser.
  - Kamera HP warga dapat langsung digunakan untuk foto bukti sampah.
