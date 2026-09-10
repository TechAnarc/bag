# 🛡️ Production Safety Guide

## ⚠️ CRITICAL: Database Reset Protection

This document outlines the safety measures implemented to prevent accidental data loss in production environments.

---

## 🔴 Dangerous Commands

The following commands will **DELETE ALL DATA** in your database. They should **NEVER** be run in production:

### ❌ NEVER Run These in Production

```bash
# These commands are DESTRUCTIVE:
npm run db:reset          # ⛔ Deletes all data
npm run setup             # ⛔ Deletes all data
npx prisma migrate reset  # ⛔ Deletes all data
.\quick-fix.ps1           # ⛔ Deletes all data (Windows)
.\setup-windows.ps1       # ⛔ Deletes all data (Windows)
```

### ✅ Safe Commands for Production

```bash
# These are SAFE for production:
npm run dev               # ✓ Starts server
npm run start             # ✓ Starts server
npm run db:migrate        # ✓ Applies new migrations only
npm run db:generate       # ✓ Regenerates Prisma client
npm run prisma:studio     # ✓ Opens database GUI (read-only recommended)
```

---

## 🛡️ Safety Mechanisms Implemented

### 1. Environment Detection

All destructive scripts now check for production indicators:

#### PowerShell Scripts
- `quick-fix.ps1` - Checks NODE_ENV and DATABASE_URL
- `setup-windows.ps1` - Checks NODE_ENV and DATABASE_URL

Both scripts will **REFUSE TO RUN** if:
- `NODE_ENV=production` is detected in `.env`
- DATABASE_URL contains production indicators:
  - `prod`, `production`
  - `amazonaws.com` (AWS RDS)
  - `azure.com` (Azure Database)
  - `render.com`, `railway.app`
  - `planetscale.com`, `supabase.co`
  - `neon.tech`

#### NPM Scripts
- `npm run db:reset` - Runs safety check first
- `npm run setup` - Runs safety check first

Both use `scripts/check-env-safety.js` to verify environment before proceeding.

### 2. Visual Warnings

When safety checks fail, you'll see:

```
╔════════════════════════════════════════════════╗
║  ⛔ DANGER: PRODUCTION ENVIRONMENT DETECTED  ⛔ ║
╚════════════════════════════════════════════════╝

This script will DELETE ALL DATA in your database!
It should NEVER be run in production.
```

---

## 📋 Production Deployment Checklist

### Before Deploying to Production

1. **Set Environment Variables**
   ```env
   NODE_ENV=production
   DATABASE_URL="postgresql://user:pass@prod-server.com/db"
   ```

2. **Verify Safety Checks**
   ```bash
   # This should FAIL with an error:
   npm run db:reset
   
   # Expected output:
   # ⛔ DANGER: PRODUCTION ENVIRONMENT DETECTED ⛔
   ```

3. **Use Safe Migration Commands**
   ```bash
   # Deploy migrations without resetting:
   npx prisma migrate deploy
   ```

### Production Migration Strategy

```bash
# 1. Generate migration locally
npm run db:migrate

# 2. Commit migration files
git add prisma/migrations
git commit -m "Add new migration"

# 3. Deploy to production (on server)
npx prisma migrate deploy  # SAFE - only applies new migrations
```

---

## 🚨 Emergency Procedures

### If You Accidentally Delete Production Data

1. **STOP IMMEDIATELY** - Don't run any more commands
2. **Check backups** - Most cloud providers have automatic backups
3. **Restore from backup** - Contact your database provider
4. **Document the incident** - For post-mortem analysis

### Backup Recommendations

#### Daily Backups (Minimum)
```bash
# Example PostgreSQL backup command:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Cloud Provider Backups
- **AWS RDS**: Enable automated backups (1-35 days retention)
- **Azure Database**: Configure automated backups
- **Render/Railway**: Use their backup features

---

## 🔧 Testing Safety Mechanisms

### Test 1: Production Environment Detection

1. Create a test `.env.production` file:
   ```env
   NODE_ENV=production
   DATABASE_URL="postgresql://localhost:5432/test"
   ```

2. Try to run destructive command:
   ```bash
   npm run db:reset
   ```

3. **Expected**: Script refuses to run with error message

### Test 2: Production Database Detection

1. Modify `.env`:
   ```env
   NODE_ENV=development
   DATABASE_URL="postgresql://prod-db.amazonaws.com/mydb"
   ```

2. Try to run destructive command:
   ```bash
   npm run db:reset
   ```

3. **Expected**: Script detects production database and refuses to run

### Test 3: Safe Development Environment

1. Use proper development config:
   ```env
   NODE_ENV=development
   DATABASE_URL="postgresql://localhost:5432/triveni_db"
   ```

2. Run destructive command:
   ```bash
   npm run db:reset
   ```

3. **Expected**: Safety check passes, command executes

---

## 📝 Environment Variable Best Practices

### Development (.env)
```env
NODE_ENV=development
DATABASE_URL="postgresql://localhost:5432/triveni_dev"
```

### Staging (.env.staging)
```env
NODE_ENV=staging
DATABASE_URL="postgresql://staging-server/triveni_staging"
# Still treat as production - data may be valuable
```

### Production (.env.production)
```env
NODE_ENV=production
DATABASE_URL="postgresql://prod-server/triveni_prod"
# NEVER run db:reset with this config
```

---

## 🎓 Training Recommendations

### For Developers

1. **Never** run `db:reset` without understanding what it does
2. **Always** check your `.env` file before running destructive commands
3. **Use** `db:migrate` instead of `db:reset` for schema changes
4. **Test** migrations locally before deploying to production

### For DevOps/Infrastructure

1. **Implement** database access controls
2. **Restrict** production database access to specific IPs
3. **Enable** automated backups with point-in-time recovery
4. **Monitor** for destructive operations
5. **Document** disaster recovery procedures

---

## 📊 Safety Checklist Summary

- [x] PowerShell scripts check NODE_ENV
- [x] PowerShell scripts check DATABASE_URL for production indicators
- [x] NPM scripts run environment safety checks
- [x] Visual warnings displayed when production detected
- [x] Documentation created for production safety
- [x] Safe migration commands documented
- [x] Backup strategies recommended
- [x] Testing procedures provided

---

## 🔗 Related Files

- `scripts/check-env-safety.js` - Environment safety checker
- `quick-fix.ps1` - Quick fix script (with safety checks)
- `setup-windows.ps1` - Setup script (with safety checks)
- `package.json` - NPM scripts with safety guards
- `SETUP_WINDOWS.md` - Development setup guide

---

## 📞 Support

If you have questions about production safety:

1. Review this document thoroughly
2. Check the safety mechanism implementations
3. Test in a safe environment first
4. When in doubt, **DO NOT RUN** destructive commands

---

**Remember**: It's better to be overly cautious than to lose production data!

**Last Updated**: 2026-02-06  
**Maintained By**: Triveni Development Team
