# 🗄️ Database Setup & Migration Guide

This document outlines the production-grade database management strategy for the Triveni Platform.

## 🛡️ Safety First
Generic destructive commands are blocked in production environments.
- **NEVER** run `db:reset` or `migrate reset` in production.
- **NEVER** use `db:push` for production schema updates.

## 🚀 Development Workflow

### 1. Initial Setup
To set up a fresh database on Windows or Linux:
```bash
npm install
npm run db:generate   # Safely generates Prisma client
npm run db:reset      # Creates tables and seeds data (DEV ONLY)
npm run dev           # Starts the server
```

### 2. Making Schema Changes
When you modify `prisma/schema.prisma`:
```bash
npm run db:migrate    # Creates a migration file and applies it
```
Always commit the generated migration files in `prisma/migrations/`.

## 🏭 Production Deployment

### 1. Baseline
Ensure all development migrations are committed to Git.

### 2. Deployment
On the production server, run:
```bash
npx prisma migrate deploy
```
This applies pending migrations without deleting existing data. It is the **only** safe way to update the production database.

## 🏥 Health & Diagnostics
You can verify the database state via API:
- **Basic Health**: `GET /health`
- **DB Diagnostics**: `GET /health/db`

## 🛠️ Troubleshooting

### Windows EPERM Error
If you see `EPERM: operation not permitted` during `prisma generate`:
1. Stop all running `node.exe` processes (or stop `npm run dev`).
2. Run `npm run db:generate`.
3. The built-in `db:clean` script handles the directory cleanup safely.

### Migration Drift
If your local DB is out of sync with migrations:
```bash
npm run db:reset
```
*Warning: This will clear all data in your local database.*

## 🔍 Architecture
- **Bi-directional Relations**: All Prisma models are strictly bound.
- **Defensive Seeding**: Startup jobs check for table existence before running.
- **Audit Logs**: All sensitive operations are logged to the `AuditLog` table.
