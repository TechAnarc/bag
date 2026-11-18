# 🔧 Backend Local Setup Guide (Windows)

> **🚨 PRODUCTION SAFETY WARNING 🚨**  
> This guide contains DESTRUCTIVE commands that will DELETE ALL DATA in your database.  
> **NEVER run these commands in a production environment!**  
> See [PRODUCTION_SAFETY.md](./PRODUCTION_SAFETY.md) for detailed safety information.

---

## 🚨 Common Issues & Solutions

This guide addresses the most common backend setup failures:

- ❌ Prisma tables not created (Admin, Order, etc. missing)
- ❌ Prisma drift detection on first run
- ❌ Windows EPERM rename query_engine-windows.dll.node during prisma generate
- ❌ Port 4000 already in use due to stale node.exe processes
- ❌ Background services (SLA monitor / seed scripts) running before DB is migrated
- ❌ SMTP error due to missing env credentials

---

## ✅ Quick Fix (Recommended)

If you're experiencing any of the issues above, use this **one-command fix**:

```powershell
.\quick-fix.ps1
```

This script will:
1. Kill any process on port 4000
2. Clean Prisma engine lock
3. Reset database with migrations
4. Generate Prisma client
5. Start the dev server

---

## 🛠️ Manual Setup (Step-by-Step)

### 1. Kill Processes on Port 4000

```powershell
# Find processes
netstat -ano | findstr :4000

# Kill process (replace <PID> with the actual process ID)
taskkill /PID <PID> /F
```

### 2. Clean Prisma Engine

```powershell
# Remove Prisma engine to prevent lock issues
Remove-Item -Path "node_modules\.prisma" -Recurse -Force
```

### 3. Fresh Install (Optional)

```powershell
# Only if you're having dependency issues
Remove-Item -Path "node_modules" -Recurse -Force
npm install
```

### 4. Reset Database & Apply Migrations

```powershell
# This will DELETE all data and recreate schema
npm run db:reset

# OR use Prisma directly
npx prisma migrate reset --force
```

### 5. Generate Prisma Client

```powershell
npm run db:generate

# OR use Prisma directly
npx prisma generate
```

### 6. Start Backend

```powershell
npm run dev
```

---

## 📋 Available NPM Scripts

```json
{
  "dev": "Start development server with hot reload",
  "start": "Start production server",
  "db:reset": "Reset database and apply all migrations",
  "db:migrate": "Create and apply new migration",
  "db:generate": "Generate Prisma Client",
  "db:push": "Push schema changes without migrations",
  "setup": "Full setup: reset DB + generate client + start server",
  "prisma:studio": "Open Prisma Studio (DB GUI)"
}
```

---

## 🔐 Environment Variables

### Required Variables

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:123@localhost:5432/triveni_db?schema=public"

# Auth
JWT_ACCESS_SECRET="dev_access_secret_123"
JWT_REFRESH_SECRET="dev_refresh_secret_123"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Admin
ADMIN_JWT_SECRET="dev_admin_secret_123"
ADMIN_EMAIL="mahakal.mahakali014@gmail.com"
ADMIN_PASSWORD="<YOUR_SECURE_ADMIN_PASSWORD>"
ADMIN_NAME="Super Admin"
ADMIN_ROLE="SUPER_ADMIN"

# Security
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN="http://localhost:5173"

# Payment (Optional in dev)
RAZORPAY_KEY_ID="rzp_test_placeholder"
RAZORPAY_KEY_SECRET="rzp_secret_placeholder"
```

### Optional Variables (Won't Crash if Missing)

```env
# SMTP (Email features will be disabled if not provided)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM_NAME="Triveni Jewellers"
SMTP_FROM_EMAIL="triveni1gram@gmail.com"

# Frontend
FRONTEND_URL="http://localhost:5173"
```

---

## ✅ Verifying Success

After running `npm run dev`, you should see:

```
2026-02-06 09:49:11:4911 info: 📝 Swagger UI: http://localhost:4000/api-docs
2026-02-06 09:49:11:4911 info: 📡 Database connected successfully
2026-02-06 09:49:11:4911 info: 📡 Socket.IO initialized
2026-02-06 09:49:11:4911 info: ✨ Super Admin created successfully: admin@example.com
2026-02-06 09:49:11:4911 info: 🚀 Triveni Commerce OS - Phase 5 Infrastructure Online
2026-02-06 09:49:11:4911 info: 🚀 Server running in development mode on port 4000
```

### What You Should NOT See:

❌ `The table 'public.Admin' does not exist in the current database.`
❌ `SMTP Connection Error: Missing credentials for "PLAIN"`
❌ `EPERM: operation not permitted, rename`
❌ `Port 4000 is already in use`

---

## 🔄 Setup Scripts

### Interactive Setup (with prompts)
```powershell
.\setup-windows.ps1
```

### Quick Fix (no prompts)
```powershell
.\quick-fix.ps1
```

### NPM One-Liner
```powershell
npm run setup
```

---

## 🐛 Troubleshooting

### Issue: "Table does not exist"
**Solution**: Run `npm run db:reset` to apply migrations

### Issue: "EPERM rename query_engine"
**Solution**: Kill all Node processes and clean Prisma:
```powershell
taskkill /F /IM node.exe
Remove-Item -Path "node_modules\.prisma" -Recurse -Force
npm run db:generate
```

### Issue: "Port 4000 already in use"
**Solution**: Kill the process:
```powershell
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Issue: "SMTP Connection Error"
**Solution**: This is now a WARNING, not an error. The server will start successfully. Add SMTP credentials to `.env` if you need email features.

### Issue: "Prisma drift detected"
**Solution**: Reset and regenerate:
```powershell
npm run db:reset
npm run db:generate
```

---

## 📚 Additional Resources

- **API Documentation**: `http://localhost:4000/api-docs` (Swagger)
- **Database GUI**: Run `npm run prisma:studio`
- **Health Check**: `http://localhost:4000/health`
- **Test API**: Use the Postman collection in `triveni_postman_collection.json`

---

## 🎯 Best Practices

1. **Always run migrations before starting the server** for the first time
2. **Use `npm run db:reset`** when schema changes aren't applying
3. **Check the logs** - all errors are now gracefully logged as warnings when possible
4. **Kill stale processes** before running the server
5. **Keep `.env` updated** with the latest required variables

---

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. Check that PostgreSQL is running on port 5432
2. Verify your `.env` file has all required variables
3. Try the nuclear option:
   ```powershell
   taskkill /F /IM node.exe
   Remove-Item -Path "node_modules" -Recurse -Force
   npm install
   .\quick-fix.ps1
   ```

---

**Last Updated**: 2026-02-06
**Maintainer**: Triveni Development Team
