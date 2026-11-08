# Civic Logistics Dispatch, Point Redemption Validation, and Credibility Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust civic logistics dispatching workflow (mitra task claiming and real-time collector tracking), a two-step point redemption claim and admin approval system with stock management, a testable simulation helper, and credibility-boosting artifacts (GPS watermarked canvas uploads, KLHK eco-impact metrics, and printable digital receipts).

**Architecture:** Extend the MySQL database with `klaim_penukaran_poin` and dispatch relations. Implement ACID transactional endpoints for claim-verify-refund cycles in Express. Upgrade frontend components to display collector assignment tracking, official digital receipt modals with QR codes, GPS watermarking during compression, and an interactive admin claim verification tab.

**Tech Stack:** Node.js, Express, MySQL 2 (mysql2/promise with transactions), React 18, Vite, Tailwind CSS, Lucide React, HTML5 Canvas API, KaTeX/KaTeX math formatting.

**Spec:** `docs/superpowers/specs/2026-11-08-logistics-dispatch-and-reward-approval-design.md`

## Global Constraints
- Target Community: RW 05 Kalirungkut (Paguyuban RT 01-05 & Bank Sampah Unit Komunitas).
- No external paid APIs (Canvas API for watermarking, zero-API-key OpenStreetMap/Google Maps embed, pure SVG QR generator or browser print styling).
- Preserve existing comments and preserve Antislop guidelines (no generic purple AI gradients, min 44px touch targets).
- Database transactions must use `connection.beginTransaction()` and `FOR UPDATE` row locks to prevent double-spending and race conditions.

## Review Focus
- Point balance integrity: citizen points must never drop below 0, and rejected claims must reliably refund points.
- Task claiming concurrency: two mitra collectors claiming the same pickup must be handled cleanly without race conditions.
- Offline and fallback resilience: default community items and graceful degradation when storage/R2 is unavailable.
- Responsive accessibility: mobile viewports must display the tracking cards and digital receipt without horizontal overflow.
- Clean role isolation: mitra cannot redeem points; admin cannot submit waste; only citizens can initiate claims.

---

### Task 1: Database Migration for Point Claims & Task Claiming
**Files:**
- Modify: `database/db_trash.sql`
- Run SQL migration directly into local MySQL database `db_trash`.

- [ ] **Step 1:** Add DDL for `klaim_penukaran_poin` table in `database/db_trash.sql`.
- [ ] **Step 2:** Ensure `id_mitra` in `transaksi_sampah_komersil` allows `NULL` initially and is indexed.
- [ ] **Step 3:** Seed 1 realistic pending redemption claim (e.g. Warga Budi claims Minyak Goreng).
- [ ] **Step 4:** Execute migration into Laragon MySQL using `mysql.exe` command line.
- [ ] **Step 5:** Verify table creation and foreign key constraints via `DESCRIBE klaim_penukaran_poin;`.

---

### Task 2: Backend API for Logistics Dispatch (Mitra Task Claiming)
**Files:**
- Modify: `src/controllers/mitra.controller.js`
- Modify: `src/routes/mitra.route.js`

- [ ] **Step 1:** In `mitra.controller.js`, add `claimPickup`:
  - Validates `id_transaksi` from `req.params.id`.
  - Resolves `id_mitra` from logged-in user (`profiles_mitra`).
  - Checks if status is `MENUNGGU_PENJEMPUTAN`.
  - Updates `id_mitra = ?`, `status = 'DIKONFIRMASI_MITRA'`.
- [ ] **Step 2:** Register `PUT /api/mitra/pickups/:id/claim` route in `src/routes/mitra.route.js`.
- [ ] **Step 3:** Update `getWasteBankPickups` query in `mitra.controller.js` to return collector profile details (`instansi_nama`, `no_telp`, `nama_petugas`).
- [ ] **Step 4:** Run curl/PowerShell tests to verify claiming a pickup transitions status and assigns collector.

---

### Task 3: Backend API for Point Claiming, Admin Approval, and Simulation Sandbox
**Files:**
- Modify: `src/controllers/warga.controller.js`
- Modify: `src/routes/warga.route.js`
- Modify: `src/controllers/admin.controller.js`
- Modify: `src/routes/admin.route.js`

- [ ] **Step 1:** In `warga.controller.js`, create `claimReward`:
  - Deducts points immediately from `profiles_warga`.
  - Inserts row into `klaim_penukaran_poin` with status `MENUNGGU_VERIFIKASI`.
  - Creates ledger debit in `riwayat_poin` (`tipe: 'REDEEM_REWARD'`).
  - Generates unique code `KLAIM-YYMM-XXXX`.
- [ ] **Step 2:** In `warga.controller.js`, add `getMyClaims` to fetch citizen's past and active redemption vouchers.
- [ ] **Step 3:** In `warga.controller.js`, add `simulationAddPoints` (+100 points sandbox testing helper).
- [ ] **Step 4:** In `admin.controller.js`, add `getClaims` and `verifyClaim`:
  - `DISETUJUI_SIAP_AMBIL`: Sets ready status, records admin note.
  - `SELESAI_DISERAHKAN`: Decreases stock in `katalog_penukaran`.
  - `DITOLAK_BATAL`: Refunds citizen points in `profiles_warga` and creates refund ledger entry.
- [ ] **Step 5:** Register routes in `warga.route.js` and `admin.route.js`.
- [ ] **Step 6:** Execute automated API tests verifying claim, approve, and refund workflows.

---

### Task 4: Client-Side GPS Watermarking & Eco-Impact Calculator
**Files:**
- Modify: `frontend/src/utils/imageCompressor.js`
- Create: `frontend/src/utils/ecoCalculator.js`
- Modify: `frontend/src/api/client.js`

- [ ] **Step 1:** Enhance `imageCompressor.js` to support optional metadata watermarking (overlaying semi-transparent inspection banner with GPS coordinates, date, time WIB, and branding directly onto the canvas before export).
- [ ] **Step 2:** Create `ecoCalculator.js` with KLHK Permen LHK 14/2021 coefficients (CO2e avoided, water saved, diversion rate).
- [ ] **Step 3:** Add new methods to `frontend/src/api/client.js` (`claimReward`, `getMyClaims`, `simulateAddPoints`, `claimPickup`, `getAdminClaims`, `verifyAdminClaim`).
- [ ] **Step 4:** Test `ecoCalculator` and `client.js` helpers.

---

### Task 5: Frontend Mitra Portal Upgrade (Task Claiming & Collector Dispatch)
**Files:**
- Modify: `frontend/src/pages/PortalMitra.jsx`

- [ ] **Step 1:** In `PortalMitra.jsx` (Bank Sampah tab), distinguish between unassigned requests and claimed requests:
  - Unclaimed requests show button: **"Ambil Tugas Penjemputan"**.
  - Claimed requests show badge: **"Ditugaskan kepada Anda"** with button **"Verifikasi Timbangan Fisik"**.
- [ ] **Step 2:** Wire up claiming to `api.claimPickup()`.
- [ ] **Step 3:** Add filter tabs: "Perlu Dijemput (Terbuka)" vs "Tugas Saya".
- [ ] **Step 4:** Test claiming workflow in browser and verify UI feedback.

---

### Task 6: Frontend Citizen Upgrade (Tracking Collector, Claim Voucher & Sandbox Simulation)
**Files:**
- Modify: `frontend/src/pages/SetorSampah.jsx`
- Create: `frontend/src/components/DigitalReceiptModal.jsx`

- [ ] **Step 1:** In `SetorSampah.jsx`, create sub-tab or modal for "Voucher & Status Klaim Sembako" showing active claims (`KLAIM-...`), status badge, and collection instructions at Balai RT.
- [ ] **Step 2:** In transaction history, display assigned collector info: *"Dijemput oleh: [Nama Petugas/Armada] (No. Telp)"*.
- [ ] **Step 3:** Implement `DigitalReceiptModal.jsx`: official printable receipt card with RT/RW header, itemized breakdown, points earned, and verification QR code.
- [ ] **Step 4:** Add demo simulation button in the header for citizens: `+100 Poin Simulasi (Uji Coba Cepat)` with clear feedback.
- [ ] **Step 5:** Test redemption claim, real-time balance update, and digital receipt print preview.

---

### Task 7: Frontend Admin Dashboard Upgrade (Klaim Approval & Eco-Impact Metrics)
**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

- [ ] **Step 1:** Add 3rd tab in `AdminDashboard.jsx`: **"Validasi Klaim Sembako Warga"**.
- [ ] **Step 2:** Render table of incoming redemption claims with citizen name, RT/RW, item requested, point cost, date, and status.
- [ ] **Step 3:** Add action buttons: **"Setujui (Siap Ambil di Balai RT)"**, **"Serahkan Barang (Potong Stok)"**, and **"Tolak & Kembalikan Poin"**.
- [ ] **Step 4:** Enhance the top metrics grid with the **Kalkulator Dampak Lingkungan KLHK**:
  - Emisi Karbon Tercegah (\(\text{kg CO}_2\text{e}\))
  - Air Bersih Terlindungi (Liter)
  - Tingkat Diversi Sampah (% Lolos dari TPA)
- [ ] **Step 5:** Run `npm run build` and verify 0 errors.

---

### Task 8: End-to-End Verification & Commit
- [ ] **Step 1:** Run full end-to-end simulation:
  - Warga Budi deposits &rarr; Mitra claims & weighs &rarr; Points credit &rarr; Warga claims Rice 2.5 kg &rarr; Admin approves & hands over &rarr; Stock decreases &rarr; Warga views printable digital receipt.
- [ ] **Step 2:** Verify rejection and refund: Admin cancels another claim &rarr; Points restored to citizen.
- [ ] **Step 3:** Commit all changes with structured git messages.
