# Trash Management Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the monolithic Express+EJS `trash-management` repository into a decoupled, production-grade portfolio case study consisting of a modular Express REST API (backed by TiDB Cloud MySQL and Cloudflare R2) and a modern, anti-slop React SPA (optimized for Cloudflare Pages).

**Architecture:** 
- **Backend:** Express.js modular REST API with `mysql2/promise` connection pooling, SSL for TiDB Cloud Serverless, streaming upload to Cloudflare R2, and a standard `/health` check. Runs in Docker on Azure VM (Port 3003, max 512MB RAM).
- **Frontend:** Client-side React 18 SPA (Vite + Tailwind CSS), built with civic-tech design standards adhering strictly to Anti-Slop UI rules (no generic AI purple glows or bento templates, clear hierarchy, accessible color contrast, mobile-friendly 44px tap targets). Deployed to Cloudflare Pages.

**Tech Stack:** Node.js, Express, `mysql2`, `@aws-sdk/client-s3`, Multer, React 18, Vite, Tailwind CSS, Lucide icons (used contextually), React Router DOM.

**Spec:** [`docs/2026-11-07-trash-management-redesign.md`](file:///d:/Developer/trash-management/docs/2026-11-07-trash-management-redesign.md)

---

## Global Constraints

- **Database:** TiDB Cloud Serverless (MySQL 8.0 syntax, InnoDB, UTF-8 MB4, SSL enabled via `rejectUnauthorized: true`).
- **Storage:** No binary files stored on VM disk; uploads stream to Cloudflare R2 via `@aws-sdk/client-s3`.
- **Memory limit:** Backend container limited to 512 MB RAM.
- **Copywriting:** No em dash (`—`) characters anywhere in UI copy or API messages (R-02).
- **UI Dials:** Energy 2 (Civic tech / trustworthy), Rhythm 2 (Consistent hierarchy), Motion 1 (Calm, hover and smooth page transitions only).
- **Accessibility:** Minimum 44px touch targets on mobile (R-03), WCAG AA color contrast (R-25), keyboard navigable with visible focus states (R-32).

---

## Review Focus

1. **Database connection failure / TiDB idle disconnect:** Pool must reconnect gracefully with `keepAlive` and clear error logging rather than crashing the process.
2. **Missing R2 credentials in local dev:** File upload service must gracefully fallback to a placeholder URL so local development functions without network credentials.
3. **Anonymous public report spam:** Ticket codes (`LAPOR-YYYYMM-XXXX`) must be cryptographically random and unique; report submission must validate file presence and coordinate bounds.
4. **Mobile layout overflow:** Input forms (especially GPS coordinates, photo picker, and timeline trackers) must reflow cleanly on screens as narrow as 360px without horizontal scroll.
5. **State machine integrity:** Transaksi komersil cannot be marked `SELESAI` without `berat_aktual_kg` verified by mitra, and poin cannot be credited twice.

---

## File Structure

```
D:\Developer\trash-management\
├── database/
│   ├── db_trash.sql                  # Production DDL and seed data (already created)
│   └── pool.js                       # mysql2/promise connection pool with SSL
├── src/
│   ├── config/
│   │   ├── env.js                    # Validated environment variables
│   │   └── s3.js                     # Cloudflare R2 S3 client
│   ├── controllers/
│   │   ├── auth.controller.js        # Register, Login, Current User profile
│   │   ├── public.controller.js      # Public illegal dump report & ticket lookup
│   │   ├── warga.controller.js       # Commercial waste sell & point ledger
│   │   ├── mitra.controller.js       # DLH cleanup actions & waste bank pickups
│   │   └── admin.controller.js       # User moderation & violation review
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT / Session verification
│   │   └── upload.middleware.js      # Multer memoryStorage
│   ├── routes/
│   │   ├── index.js                  # Main API router mounting /api/*
│   │   ├── health.route.js           # GET /health
│   │   ├── auth.route.js
│   │   ├── public.route.js
│   │   ├── warga.route.js
│   │   ├── mitra.route.js
│   │   └── admin.route.js
│   └── app.js                        # Express server entry point (port 3003)
├── frontend/                         # React SPA (Vite + Tailwind)
│   ├── src/
│   │   ├── api/client.js             # Axios / Fetch client to backend API
│   │   ├── components/               # Navbar, Footer, TicketTracker, StatusBadge
│   │   ├── pages/
│   │   │   ├── Home.jsx              # Landing page with instant ticket tracker
│   │   │   ├── LaporSampahLiar.jsx   # Public reporting form with GPS & photo
│   │   │   ├── LacakAduan.jsx        # Ticket detail & Before/After timeline
│   │   │   ├── SetorSampah.jsx       # Citizen waste bank calculator & submission
│   │   │   ├── PortalMitra.jsx       # DLH & Bank Sampah task board
│   │   │   └── AdminDashboard.jsx    # System moderation & user management
│   │   ├── App.jsx
│   │   └── index.css                 # Anti-slop civic design tokens
│   ├── package.json
│   └── vite.config.js
├── Dockerfile                        # Backend Docker container (node:20-alpine)
└── .dockerignore
```

---

## Task Decomposition

### Task 1: Backend Dependencies & Environment Setup

**Files:**
- Modify: `package.json`
- Create: `src/config/env.js`

**Interfaces:**
- Produces: `env` object containing `PORT`, `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`, `R2_*`, and `JWT_SECRET`.

- [ ] **Step 1: Update `package.json` dependencies**
  Add `mysql2`, `cors`, `helmet`, `jsonwebtoken`, and `@aws-sdk/client-s3`. Remove legacy `mysql` and `session-memory-store`. Keep `bcryptjs`, `dotenv`, `express`, `multer`.
- [ ] **Step 2: Run `npm install`**
  Verify clean installation without errors.
- [ ] **Step 3: Create `src/config/env.js`**
  Parse and export environment variables with sensible development defaults (Port `3003`, DB `db_trash`).
- [ ] **Step 4: Commit**
  ```bash
  git add package.json package-lock.json src/config/env.js
  git commit -m "chore(backend): modernize dependencies and add env config"
  ```

---

### Task 2: Database Connection Pool & Health Check

**Files:**
- Create: `database/pool.js`
- Create: `src/routes/health.route.js`
- Modify: `app.js`

**Interfaces:**
- Produces: `db.query(sql, params)` returning Promise `[rows, fields]`.
- Produces: `GET /health` returning `{ status: "ok", uptime: Number, db: "connected" }`.

- [ ] **Step 1: Implement `database/pool.js`**
  Use `mysql2/promise.createPool` configured with connection limits (10), `ssl: { rejectUnauthorized: false }` for TiDB Cloud, and `enableKeepAlive: true`.
- [ ] **Step 2: Create `src/routes/health.route.js`**
  Ping the database with `SELECT 1` and return status 200 or 503 if unreachable.
- [ ] **Step 3: Test health check endpoint**
  Run server locally and check `curl http://localhost:3003/health`.
- [ ] **Step 4: Commit**
  ```bash
  git add database/pool.js src/routes/health.route.js app.js
  git commit -m "feat(backend): add mysql2 connection pool and health check endpoint"
  ```

---

### Task 3: Cloudflare R2 Upload Service & Fallback

**Files:**
- Create: `src/config/s3.js`
- Create: `src/middleware/upload.middleware.js`

**Interfaces:**
- Produces: `uploadSingle(fieldName)` & `uploadMultiple(fields)` using `multer.memoryStorage()`.
- Produces: `uploadToR2(fileBuffer, originalName, folder)` returning public URL or mock placeholder.

- [ ] **Step 1: Implement `src/config/s3.js`**
  Initialize `S3Client` targeting `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`. If credentials are absent, export a mock streamer that generates realistic placeholder URLs.
- [ ] **Step 2: Implement `src/middleware/upload.middleware.js`**
  Validate file size (max 5MB) and mime types (`image/jpeg`, `image/png`, `image/webp`).
- [ ] **Step 3: Test file validation logic**
  Ensure files exceeding 5MB or invalid mime types return HTTP 400 with a descriptive JSON error.
- [ ] **Step 4: Commit**
  ```bash
  git add src/config/s3.js src/middleware/upload.middleware.js
  git commit -m "feat(storage): add R2 stream uploader with local dev fallback"
  ```

---

### Task 4: Public Illegal Dump Reporting & Ticket Lookup API

**Files:**
- Create: `src/controllers/public.controller.js`
- Create: `src/routes/public.route.js`

**Interfaces:**
- Produces: `POST /api/public/reports` -> `{ success: true, kode_tiket: "LAPOR-YYYYMM-XXXX", data: ... }`
- Produces: `GET /api/public/reports/ticket/:kode_tiket` -> Returns report details and array of `tindak_lanjut` updates with Before/After photos.
- Produces: `GET /api/public/reports/map` -> Returns recent verified reports with lat, long, status, and photo URL for map visualization.

- [ ] **Step 1: Implement ticket generation utility**
  Format: `LAPOR-` + 4-digit year/month + `-` + 4 random uppercase alphanumeric characters (e.g. `LAPOR-2611-9A4B`).
- [ ] **Step 2: Implement `createReport` controller**
  Store data in `laporan_sampah_ilegal` with coordinates and R2 photo URL. Return HTTP 201 with ticket code.
- [ ] **Step 3: Implement `lookupTicket` controller**
  Query `laporan_sampah_ilegal` JOIN `tindak_lanjut_aduan`. Return 404 if ticket not found.
- [ ] **Step 4: Implement `getMapReports` controller**
  Query active reports in the last 30 days with coordinates.
- [ ] **Step 5: Test API endpoints**
  Verify ticket lookup with seed ticket `LAPOR-2611-8921`.
- [ ] **Step 6: Commit**
  ```bash
  git add src/controllers/public.controller.js src/routes/public.route.js
  git commit -m "feat(api): implement public reporting and ticket tracking endpoints"
  ```

---

### Task 5: Citizen (Warga) Waste Bank & Points Ledger API

**Files:**
- Create: `src/controllers/warga.controller.js`
- Create: `src/routes/warga.route.js`

**Interfaces:**
- Produces: `GET /api/warga/categories` -> Returns active waste categories with `poin_per_kg`.
- Produces: `POST /api/warga/transactions` -> Creates commercial waste pickup request (`transaksi_sampah_komersil`).
- Produces: `GET /api/warga/points` -> Returns citizen point balance and `riwayat_poin` history.

- [ ] **Step 1: Implement `getCategories`**
  Query `kategori_sampah` where `is_active = 1`.
- [ ] **Step 2: Implement `createTransaction`**
  Validate estimated weight, calculate provisional points, generate `TRX-` code, and insert into `transaksi_sampah_komersil`.
- [ ] **Step 3: Implement `getPointHistory`**
  Query `profiles_warga.total_poin` and transactions from `riwayat_poin`.
- [ ] **Step 4: Test citizen transaction workflow**
  Verify with test citizen ID (`warga.budi@trashmanage.com`).
- [ ] **Step 5: Commit**
  ```bash
  git add src/controllers/warga.controller.js src/routes/warga.route.js
  git commit -m "feat(api): implement waste bank categories, transactions, and points ledger"
  ```

---

### Task 6: Partner (Mitra) DLH & Waste Bank Action API

**Files:**
- Create: `src/controllers/mitra.controller.js`
- Create: `src/routes/mitra.route.js`

**Interfaces:**
- Produces: `GET /api/mitra/reports` -> Lists illegal dump reports assigned to partner's city.
- Produces: `POST /api/mitra/reports/:id/action` -> Adds cleanup progress log + after-cleanup photo to `tindak_lanjut_aduan` and updates report status to `DALAM_PENANGANAN` or `SELESAI_DIBERSIHKAN`.
- Produces: `PUT /api/mitra/transactions/:id/complete` -> Verifies actual weight, updates status to `SELESAI`, and awards points to citizen in `riwayat_poin`.

- [ ] **Step 1: Implement DLH report listing & action logger**
  Include transactional update so report status changes atomically with log insertion.
- [ ] **Step 2: Implement Bank Sampah transaction verification**
  Atomically update `berat_aktual_kg`, recalculate `total_poin_diperoleh`, update `profiles_warga.total_poin`, and record `riwayat_poin`.
- [ ] **Step 3: Test action workflows**
  Verify status transitions and atomic point calculation.
- [ ] **Step 4: Commit**
  ```bash
  git add src/controllers/mitra.controller.js src/routes/mitra.route.js
  git commit -m "feat(api): implement partner disposition, cleanup logging, and pickup verification"
  ```

---

### Task 7: Auth, Admin Moderation & Router Mounting

**Files:**
- Create: `src/controllers/auth.controller.js`
- Create: `src/controllers/admin.controller.js`
- Create: `src/routes/auth.route.js`
- Create: `src/routes/admin.route.js`
- Modify: `app.js`

**Interfaces:**
- Produces: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`.
- Produces: `GET /api/admin/users`, `PUT /api/admin/users/:id/status`, `GET /api/admin/stats`.
- Mounts all sub-routers under `/api/*`.

- [ ] **Step 1: Implement JWT-based Auth Controller**
  Issue secure HTTP-only cookies or JSON tokens.
- [ ] **Step 2: Implement Admin moderation endpoints**
  List users with role filters, toggle status (`active` / `frozen`), and fetch summary metrics.
- [ ] **Step 3: Mount all routes in `app.js`**
  Mount CORS, JSON body parser, and all `/api/*` endpoints. Return 404 JSON for unknown API routes.
- [ ] **Step 4: Commit**
  ```bash
  git add src/controllers/auth.controller.js src/controllers/admin.controller.js src/routes/auth.route.js src/routes/admin.route.js app.js
  git commit -m "feat(api): mount authentication, admin moderation, and complete API router"
  ```

---

### Task 8: Frontend Scaffolding & Anti-Slop Design System

**Files:**
- Create: `frontend/` (Vite + React)
- Create: `frontend/src/index.css` (Civic-tech design tokens)
- Create: `frontend/src/api/client.js`

**UI Anti-Slop Specifications:**
- **Palette:** Emerald primary (`#059669` / `#10B981`), Deep Slate neutral (`#0F172A`), Off-white ground (`#F8FAFC`). No generic blue-purple gradients (R-01).
- **Typography:** Clear sans-serif, high legibility, strict no em dash rule (R-02).
- **States:** Every data view carries explicit Empty, Loading, and Error states (R-27).
- **Responsive:** Strict no-overflow mobile layouts, 44px minimum tap targets (R-03).

- [ ] **Step 1: Initialize Vite React app in `frontend/`**
  Run: `npm create vite@latest frontend -- --template react` (or configure minimal package.json).
- [ ] **Step 2: Configure Tailwind CSS with civic theme tokens**
  Define colors: `primary` (emerald), `slate` (neutrals), `warning` (amber), `danger` (rose).
- [ ] **Step 3: Create `src/api/client.js`**
  Configured base URL pointing to `VITE_API_BASE_URL` (defaulting to `/api` or `http://localhost:3003`).
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/
  git commit -m "feat(frontend): scaffold React SPA with civic anti-slop design system"
  ```

---

### Task 9: Public Portal Views (Lapor Liar & Lacak Aduan)

**Files:**
- Create: `frontend/src/pages/Home.jsx`
- Create: `frontend/src/pages/LaporSampahLiar.jsx`
- Create: `frontend/src/pages/LacakAduan.jsx`
- Create: `frontend/src/components/TicketBadge.jsx`

**UI Anti-Slop Requirements:**
- **Home:** Direct instant search input for ticket tracking + direct CTA "Lapor Sampah Liar". No generic "Trusted by 500+ brands" logo carousels (R-05).
- **LaporSampahLiar:** Form with native file picker, live image preview, geolocation auto-detect button, clear feedback on submit with modal showing generated Ticket Code and a one-click copy button.
- **LacakAduan:** Clean vertical timeline (Submitted -> Verified -> In Progress -> Resolved). Display Before/After comparison cards when available.

- [ ] **Step 1: Implement `Home.jsx`**
  Hero section focused on civic action: "Portal Pelaporan & Bank Sampah Kota". Include prominent ticket lookup input.
- [ ] **Step 2: Implement `LaporSampahLiar.jsx`**
  Multi-field responsive form with coordinates and file upload.
- [ ] **Step 3: Implement `LacakAduan.jsx`**
  Fetch ticket details from `/api/public/reports/ticket/:code` and render status progression with timestamps and evidence photos.
- [ ] **Step 4: Test end-to-end report and tracking flow in browser**
- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/pages/Home.jsx frontend/src/pages/LaporSampahLiar.jsx frontend/src/pages/LacakAduan.jsx frontend/src/components/TicketBadge.jsx
  git commit -m "feat(frontend): implement public reporting and ticket tracking views"
  ```

---

### Task 10: Warga, Mitra, and Admin Portals

**Files:**
- Create: `frontend/src/pages/SetorSampah.jsx`
- Create: `frontend/src/pages/PortalMitra.jsx`
- Create: `frontend/src/pages/AdminDashboard.jsx`

- [ ] **Step 1: Implement `SetorSampah.jsx`**
  Interactive waste category selector (Plastik, Kertas, Logam, etc.) with real-time point estimation as weight input changes.
- [ ] **Step 2: Implement `PortalMitra.jsx`**
  Tabbed interface for DLH (Review & Log Cleanup) and Bank Sampah (Pending Pickups & Actual Weight Verification).
- [ ] **Step 3: Implement `AdminDashboard.jsx`**
  User directory with active/frozen toggles and report overview cards.
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/pages/SetorSampah.jsx frontend/src/pages/PortalMitra.jsx frontend/src/pages/AdminDashboard.jsx
  git commit -m "feat(frontend): implement citizen waste bank, partner action board, and admin portal"
  ```

---

### Task 11: Dockerfile & Production Deployment Readiness

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Create multi-stage `Dockerfile`**
  Base `node:20-alpine`, minimal layer caching, non-root user execution, port 3003 exposed.
- [ ] **Step 2: Create `.dockerignore`**
  Exclude `node_modules`, `frontend`, `.git`, `.env`.
- [ ] **Step 3: Test local Docker build**
  Verify image size is under 180 MB and runs within 512 MB memory boundary.
- [ ] **Step 4: Commit**
  ```bash
  git add Dockerfile .dockerignore
  git commit -m "feat(docker): add production Dockerfile and build configuration"
  ```
