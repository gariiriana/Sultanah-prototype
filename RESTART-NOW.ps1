# ✅ SULTANAH - RESTART SCRIPT FOR WINDOWS (FIXED IMAGES!)
# PowerShell script to restart dev server with clean cache

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 SULTANAH - RESTART WITH CLEAN CACHE            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Stop any running node processes
Write-Host "⛔ Stopping dev server..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 1

# Clear Vite cache
Write-Host "🗑️  Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "   ✅ Vite cache deleted" -ForegroundColor Green
}

# Clear npm cache
Write-Host "🗑️  Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host ""
Write-Host "✅ Cache cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting dev server..." -ForegroundColor Cyan
Write-Host ""

# Restart dev server
npm run dev
