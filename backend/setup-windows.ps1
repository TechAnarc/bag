# Triveni Backend - Windows Setup Script
# ⚠️ DEVELOPMENT ONLY - DO NOT RUN IN PRODUCTION

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Triveni Backend Setup (Windows)   " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Safety Check: Prevent running in production
Write-Host "Checking environment safety..." -ForegroundColor Yellow
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
if ($envFile -match 'DATABASE_URL.*prod|DATABASE_URL.*production|amazonaws\.com|azure\.com|render\.com|railway\.app') {
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

Write-Host "✓ Development environment confirmed" -ForegroundColor Green
Write-Host ""

# Step 1: Kill any process holding port 4000
Write-Host "[1/6] Checking for processes on port 4000..." -ForegroundColor Yellow
$processInfo = netstat -ano | findstr :4000
if ($processInfo) {
    $processInfo | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $pid = $matches[1]
            Write-Host "  Found process $pid on port 4000. Terminating..." -ForegroundColor Red
            taskkill /PID $pid /F 2>$null
        }
    }
    Write-Host "  ✓ Port 4000 is now free" -ForegroundColor Green
} else {
    Write-Host "  ✓ Port 4000 is free" -ForegroundColor Green
}
Write-Host ""

# Step 2: Clean Prisma client to prevent lock issues
Write-Host "[2/6] Cleaning Prisma client..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Path "node_modules\.prisma" -Recurse -Force
    Write-Host "  ✓ Prisma client cleaned" -ForegroundColor Green
} else {
    Write-Host "  ✓ Prisma client already clean" -ForegroundColor Green
}
Write-Host ""

# Step 3: Fresh install (optional - comment out if not needed)
Write-Host "[3/6] Checking node_modules..." -ForegroundColor Yellow
$reinstall = Read-Host "Do you want to reinstall node_modules? (y/N)"
if ($reinstall -eq "y" -or $reinstall -eq "Y") {
    Write-Host "  Removing node_modules..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item -Path "node_modules" -Recurse -Force
    }
    Write-Host "  Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✓ Skipping reinstall" -ForegroundColor Green
}
Write-Host ""

# Step 4: Reset DB and apply migrations cleanly
Write-Host "[4/6] Resetting database and applying migrations..." -ForegroundColor Yellow
Write-Host "  ⚠️  This will DELETE all data and recreate the database schema." -ForegroundColor Red
$confirm = Read-Host "Continue? (y/N)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    npx prisma migrate reset --force
    Write-Host "  ✓ Database reset and migrations applied" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Skipping database reset. Run 'npm run db:migrate' manually if needed." -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Generate Prisma client
Write-Host "[5/6] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "  ✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 6: Start backend
Write-Host "[6/6] Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! Starting server... " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
npm run dev
