# Quick Fix Script - No prompts, just fixes everything
# ⚠️ DEVELOPMENT ONLY - DO NOT RUN IN PRODUCTION

# Safety Check: Prevent running in production
$envFile = Get-Content .env -ErrorAction SilentlyContinue
if ($envFile -match 'NODE_ENV\s*=\s*production') {
    Write-Host "" -ForegroundColor Red
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ⛔ DANGER: PRODUCTION ENVIRONMENT DETECTED  ⛔ ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "This script will DELETE ALL DATA in your database!" -ForegroundColor Red
    Write-Host "It should NEVER be run in production." -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "If you're certain this is a development environment," -ForegroundColor Yellow
    Write-Host "change NODE_ENV to 'development' in .env and try again." -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Red
    exit 1
}

# Check if DATABASE_URL contains production indicators
if ($envFile -match 'DATABASE_URL.*prod|DATABASE_URL.*production|amazonaws\.com|azure\.com') {
    Write-Host "" -ForegroundColor Red
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ⛔ PRODUCTION DATABASE DETECTED  ⛔          ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "Your DATABASE_URL appears to point to a production database!" -ForegroundColor Red
    Write-Host "This script will DELETE ALL DATA!" -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    exit 1
}

Write-Host "" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Quick Fix - Development Environment       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Yellow
Write-Host "⚠️  This will reset your development database!" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Green

# Kill port 4000
Write-Host "[1/4] Killing processes on port 4000..." -NoNewline
netstat -ano | findstr :4000 | ForEach-Object {
    if ($_ -match '\s+(\d+)\s*$') {
        taskkill /PID $matches[1] /F 2>$null | Out-Null
    }
}
Write-Host " ✓" -ForegroundColor Green

# Clean Prisma
Write-Host "[2/4] Cleaning Prisma engine..." -NoNewline
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Path "node_modules\.prisma" -Recurse -Force 2>$null
}
Write-Host " ✓" -ForegroundColor Green

# Reset DB
Write-Host "[3/4] Resetting database..." -NoNewline
npx prisma migrate reset --force --skip-seed 2>&1 | Out-Null
Write-Host " ✓" -ForegroundColor Green

# Generate Prisma
Write-Host "[4/4] Generating Prisma client..." -NoNewline
npx prisma generate 2>&1 | Out-Null
Write-Host " ✓" -ForegroundColor Green

Write-Host ""
Write-Host "✅ All fixed! Starting server..." -ForegroundColor Green
Write-Host ""
npm run dev
