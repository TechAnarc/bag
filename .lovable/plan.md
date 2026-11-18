# Enterprise Admin Panel — Triveni Bombay Bag House

This is a very large scope (18+ admin sections, real database, auth, analytics, CSV import/export, coupons, banners, newsletter, returns, permissions, etc.). To ship it responsibly and keep it maintainable, I'll build it in phases against a real backend — no mock data anywhere. Each phase produces a working, shippable slice.

## Foundation (Phase 0 — this turn)

1. **Enable Lovable Cloud** (Postgres + Auth + Storage).
2. **Auth**
   - Email/password login at `/admin/login`.
   - Seed the admin user `trivenibag@gmail.com` / `<YOUR_SECURE_ADMIN_PASSWORD>`.
   - `user_roles` table + `has_role()` security-definer function (admin/manager/staff).
   - Protected `_authenticated/admin` route subtree; non-admins bounced to `/`.
3. **Core schema (migration with GRANTs + RLS):**
   - `categories`, `brands`, `products`, `product_images`, `inventory_movements`
   - `customers` (mirrors auth.users via profile), `addresses`
   - `orders`, `order_items`, `order_events` (status timeline)
   - `coupons`, `coupon_redemptions`
   - `reviews`, `review_replies`
   - `banners`, `newsletter_subscribers`, `newsletter_campaigns`
   - `returns`, `payments`, `settings` (single-row store config)
   - `notifications` (admin bell)
   - All RLS-locked to admin role via `has_role(auth.uid(),'admin')`.
4. **Admin shell** (`src/routes/_authenticated/admin/`)
   - Sticky glass sidebar (all 18 sections listed, icons, active state, badges).
   - Top nav: global search, notification bell, dark mode, profile menu, quick-create, date.
   - Framer-motion transitions, loading skeletons, empty states, toasts.
5. **Dashboard home** wired to real aggregates (all zeros when empty):
   - KPI cards (revenue today/month, orders by status, AOV, customers, products, low/out-of-stock, coupons active, subscribers, reviews) via server functions using SQL aggregates.
   - Recharts sales chart (daily/weekly/monthly/yearly) — empty when no data.
   - Recent orders table (empty state when 0).

## Phase 1 — Catalog & Orders (next turn)
Products (list + full form with image upload to Storage, SEO, variants stub, related), Categories (nested), Inventory (stock, movements, low-stock alerts), Orders (list + detail + timeline + status transitions + invoice PDF stub).

## Phase 2 — Customers, Reviews, Marketing
Customers list/detail with LTV, Reviews moderation, Coupons CRUD + analytics, Banners with scheduling, Newsletter subscribers + campaigns.

## Phase 3 — Ops & Reports
Returns, Payments ledger, Shipping, Analytics deep-dive, Reports (CSV/Excel/PDF export), Settings (store config), Permissions (role management UI).

## Technical notes
- Data via `createServerFn` + `requireSupabaseAuth` middleware. Admin-only fns additionally check `has_role(userId,'admin')`.
- Storefront (`/`, `/shop`, `/product/*`, `/cart`, `/checkout`) stays on its current local catalog for now; migrating it to read from the DB is a follow-up (say the word and I'll flip it).
- Product images stored in a public `product-images` Storage bucket.
- Zero mock data anywhere in `/admin` — empty tables/charts/KPIs when DB is empty.

## What I need from you
Confirm to proceed with **Phase 0** now. I'll enable Cloud, run the schema migration, seed the admin user, and ship the shell + real-data dashboard + login. Then we iterate through phases 1–3.

Also confirm:
- Should the storefront (product catalog shown to customers) also migrate to the database now, or stay on the local seed until after Phase 1?
