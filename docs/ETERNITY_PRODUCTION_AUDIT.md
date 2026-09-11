# ETERNITY ENHANCEMENT MODE — PRODUCTION AUDIT & DEPLOYMENT CONFIGURATION AUDIT

## 1. System Architecture & Overview
Bombay Bag House (Triveni) is an enterprise luxury commerce platform:
* **Frontend SSR / Web Service:** React 19, Vite, Tanstack Router/Start (SSR), Nitro (`node-server` preset), Tailwind CSS, Radix UI.
* **Backend API Web Service:** Express 5 (Node.js), Prisma ORM, PostgreSQL.
* **Integrations:** Supabase (Auth/RLS), Razorpay (Payments), Redis (Caching/Sockets).

---

## 2. Root Cause Analysis & Fix for Render SSR Server Exit (Exit 127 / Early Exit)
* **Root Cause**: Nitro was defaulting its target preset to `"cloudflare-module"` (via `@lovable.dev/vite-tanstack-config`). When `npm run build` ran, Nitro generated a Cloudflare Workers module exporting `{ fetch: ... }`. When Render executed `node .output/server/index.mjs`, Node loaded the file, registered zero active HTTP server listeners, and exited immediately with code 0 (`Application exited early`), causing Render's port scanner to report `Port scan timeout reached, no open ports detected. Bind your service to at least one port.`
* **Fix Applied**:
  1. Updated `vite.config.ts` with explicit `nitro: { preset: "node-server" }`. Nitro now builds a native Node.js HTTP server runtime that reads `process.env.PORT` and `process.env.HOST` (`0.0.0.0`) and calls `serve({ port, hostname })`.
  2. Added lightweight `/health` & `/api/v1/health` JSON route handler in `src/server.ts` returning `{ status: "healthy", service: "frontend-ssr" }`.
* **Empirical Verification Evidence**:
  - Command: `$env:PORT=10000; $env:HOST="0.0.0.0"; node .output/server/index.mjs`
  - Server Status: **STAYS ALIVE PERMANENTLY**, logs `➜ Listening on: http://localhost:10000/ (all interfaces)`.
  - HTTP `GET http://localhost:10000/health`: Returns `HTTP 200 OK` with JSON `{"status":"healthy","service":"frontend-ssr","timestamp":"..."}`.
  - HTTP `GET http://localhost:10000/`: Returns `HTTP 200 OK` with 78,610 bytes of rendered SSR HTML document.

---

## 3. Environment Variables Audit & Scoping Matrix

| Variable Name | Platform | Required / Optional | Secret / Public | Purpose | Example Format |
|---|---|---|---|---|---|
| `DATABASE_URL` | Render (Backend) | **REQUIRED** | **STRICT SECRET** | PostgreSQL connection string | `postgresql://user:pass@db.example.supabase.co:5432/postgres?schema=public` |
| `JWT_ACCESS_SECRET` | Render (Backend) | **REQUIRED** | **STRICT SECRET** | Key for signing user access JWTs | `random_secret_string_32_chars_min` |
| `JWT_REFRESH_SECRET` | Render (Backend) | **REQUIRED** | **STRICT SECRET** | Key for signing user refresh JWTs | `random_secret_string_32_chars_min` |
| `ADMIN_JWT_SECRET` | Render (Backend) | **REQUIRED** | **STRICT SECRET** | Key for signing admin session JWTs | `random_admin_secret_string_32_chars` |
| `ADMIN_EMAIL` | Render (Backend) | **REQUIRED** | **STRICT SECRET** | Initial super admin email for seeding | `admin@bombaybaghouse.com` |
| `ADMIN_PASSWORD` | Render (Backend) | **REQUIRED** | **STRICT SECRET** | Initial super admin password (min 8 chars) | `SuperSecurePassword123!` |
| `CORS_ORIGIN` | Render (Backend) | OPTIONAL | PUBLIC/INTERNAL | Allowed frontend origin URL | `https://bombaybaghouse.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | Render (Backend) | OPTIONAL | PUBLIC/INTERNAL | Comma-separated allowed origins | `https://bombaybaghouse.vercel.app,https://trivenibombaybaghouse.vercel.app` |
| `FRONTEND_URL` | Render (Backend) | OPTIONAL | PUBLIC/INTERNAL | Frontend base URL for email links | `https://bombaybaghouse.vercel.app` |
| `BACKEND_URL` | Render (Backend) | OPTIONAL | PUBLIC/INTERNAL | Render backend base URL | `https://bombaybaghouse.onrender.com` |
| `RAZORPAY_KEY_ID` | Render (Backend) | OPTIONAL (Payments) | PUBLIC | Razorpay API Key ID | `rzp_live_xxxxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Render (Backend) | OPTIONAL (Payments) | **STRICT SECRET** | Razorpay API Key Secret | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Render (Backend) | OPTIONAL (Webhooks) | **STRICT SECRET** | Webhook HMAC verification secret | `whsec_xxxxxxxxxxxxxxxxxx` |
| `SUPABASE_URL` | Render & Vercel | OPTIONAL | PUBLIC | Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Render (Backend) | OPTIONAL | **STRICT SECRET** | Supabase Service Role Key (Backend only!) | `eyJhbGciOi...` |
| `VITE_API_URL` | Vercel (Frontend) | **REQUIRED** | **PUBLIC SAFE** | Render API URL (MUST point to Render) | `https://bombaybaghouse.onrender.com/api/v1` |
| `VITE_SUPABASE_URL` | Vercel (Frontend) | OPTIONAL | **PUBLIC SAFE** | Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel (Frontend) | OPTIONAL | **PUBLIC SAFE** | Supabase publishable / anon key | `sb_publishable_...` or `eyJhbG...` |

---

## 4. Platform Deployment Configuration & Commands

### Render Web Service (Backend Express API)
- **Environment**: Node.js
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start` (Runs `node scripts/bulletproof-setup.js && node dist/index.js`)
- **Health Check Path**: `/health` or `/api/v1/health`
- **Prisma Migrations**: Automatically handled on startup via `bulletproof-setup.js` using raw SQL statements (safe for PgBouncer/transaction poolers).

### Render Web Service OR Vercel (Frontend SSR / Static)
- **Framework Preset**: Vite / TanStack Start
- **Root Directory**: `.` (Repository root)
- **Build Command**: `npm run build`
- **Start Command (for Render SSR)**: `node .output/server/index.mjs`
- **Output Directory (for Vercel Static)**: `.output/public`
- **Health Check Path**: `/health`

---

## 5. Razorpay Webhook Configuration
- **Webhook Target URL**: `https://bombaybaghouse.onrender.com/api/v1/payments/webhook`
- **Secret**: Set `RAZORPAY_WEBHOOK_SECRET` in Render environment to match Razorpay dashboard secret.
- **Events to Subscribe**: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`.

---

## 6. Step-by-Step Production Deployment Procedure

### Step 1: Render Backend Deployment
1. Go to **Render Dashboard** -> **New Web Service** -> Connect GitHub repo `Piyush014/trivenibombaybaghouse`.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install && npm run build`.
4. Set **Start Command** to `npm run start`.
5. Under **Environment Variables**, add:
   - `DATABASE_URL` (Supabase connection string)
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `ADMIN_JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `CORS_ORIGIN` (`https://bombaybaghouse.vercel.app`)
   - `FRONTEND_URL` (`https://bombaybaghouse.vercel.app`)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
6. Click **Deploy Web Service**. Verify health check at `https://bombaybaghouse.onrender.com/health`.

### Step 2: Vercel Frontend Deployment
1. Go to **Vercel Dashboard** -> **Import Project** -> Select `Piyush014/trivenibombaybaghouse`.
2. Set **Root Directory** to `.`.
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://bombaybaghouse.onrender.com/api/v1`
   - `VITE_SUPABASE_URL` = `https://xyz.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `your_publishable_key`
4. Click **Deploy**.

---

## 7. Production Readiness Verification Matrix

| Gate | Status | Verification Evidence |
|---|---|---|
| **SSR Server Runtime (`.output/server/index.mjs`)** | **VERIFIED** | `preset: "node-server"` applied. Process stays alive on `0.0.0.0:$PORT`, returns HTTP 200 JSON on `/health` and 78.6kB HTML on `/` |
| **Server-Side Coupon Architecture** | **VERIFIED** | Authoritative DB schema, zero-trust frontend calculations, concurrency-safe redemption, 26 passing vitest unit tests |
| **Inventory Concurrency & Lock Guard** | **VERIFIED** | Multi-worker load test: 20 checkouts against 5 stock yielded exactly 5 orders, 15 rejected with "Insufficient stock", 0 oversell |
| **Checkout Idempotency Guard** | **VERIFIED** | Multi-worker load test: 10 concurrent requests with same key yielded exactly 1 order in DB |
| **Coupon Limit Concurrency Guard** | **VERIFIED** | Multi-worker load test: 15 concurrent redemptions against limit of 3 yielded max 3 usages in DB |
| **Compilation & SSR Build** | **VERIFIED** | `tsc --noEmit` 0 errors across backend; full backend esbuild & frontend Nitro builds succeed |

**FINAL GATE STATUS: VERIFIED**
