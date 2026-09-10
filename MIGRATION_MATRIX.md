# MIGRATION MATRIX

## 1. Authentication & Security
- **Source (Triveni)**: Dual-tap JWT authentication (HttpOnly Cookie + LocalStorage Bearer), `adminAuth.middleware.ts`.
- **Target (Bombay Bag House)**: Supabase direct auth (`supabase.auth.signInWithPassword`), `auth-middleware.ts` running in TanStack Server Functions.
- **Migration Plan**: Keep Supabase auth for clients (if heavily integrated into TanStack), but introduce the robust Dual-Tap JWT & Prisma-backed authentication for the Admin studio and separated Node.js Backend as per the master transfer guide.

## 2. Product Engine
- **Source**: `Product` Prisma schema with rich jewellery-specific attributes (Purity, Carat, Weight, Ring Size).
- **Target**: Basic Supabase products table (`products`).
- **Adaptation**: Convert `Purity`, `Carat`, `Weight` into a flexible `attributes` JSON field or dedicated columns for Bag specifics (`Material`, `Capacity`, `Dimensions`, `Compartments`, `Laptop Compatibility`).

## 3. Order Management & Fulfillment
- **Source**: Complex stateful machine (`OrderStateTracker.tsx`), multiple logistics providers, invoice generation.
- **Target**: Simple `orders` table in Supabase with basic status updates via `updateOrderStatus`.
- **Migration Plan**: Port the entire `backend/src/modules/orders` and `frontend/features/admin/components/OrderStateTracker.tsx`, adapting the Prisma schema.

## 4. Autonomous Decision Engine (ADE) & UPIS
- **Source**: Sophisticated background tracking, churn prediction, visitor radar.
- **Target**: Does not exist.
- **Migration Plan**: Port directly as universal functionality.

## 5. UI & Styling
- **Source**: Tailwind + Shadcn UI with Triveni specific styling.
- **Target**: Tailwind + Radix UI with Bombay Bag House brand (Gold `#D4AF37`, Ink `#0A0A0A`, Cream `#F8F5EE`, `animate-float`, `shimmer-gold`).
- **Migration Plan**: Preserve all target styling. When bringing in Admin UI components from Triveni, re-map their CSS variables to match target variables (`var(--gold)`, `var(--ink)`).

## 6. Deployment Architecture
- **Source**: Frontend on Vercel, Backend on Render (Node.js/Express + Prisma + Supabase Postgres).
- **Target**: Monolithic TanStack Start app on Render (Node-server preset) + Supabase Auth/DB.
- **Migration Plan**: The command explicitly requested Vercel (Frontend) and Render (Backend) configs. We will refactor the target repo to adopt the `frontend`/`backend` workspace split, preserving the current TanStack Start app inside `frontend/` but redirecting all data fetching to the robust Express `backend/`.
