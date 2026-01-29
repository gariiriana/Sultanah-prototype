# ✅ SULTANAH - FIX IMAGES (Windows PowerShell)

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🔥 SULTANAH - FIX IMAGES (CLEAR CACHE & RESTART)    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Stop running processes
Write-Host "⛔ Stopping dev server..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

# Clear ALL cache
Write-Host "🗑️  Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
}

Write-Host "🗑️  Clearing Node cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
}

Write-Host "🗑️  Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host ""
Write-Host "✅ ALL CACHE CLEARED!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting dev server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "  ⚠️  IMPORTANT: After server starts, do this in browser:" -ForegroundColor Red
Write-Host ""
Write-Host "  1. Press: Ctrl+Shift+R (20-30 TIMES!)" -ForegroundColor White
Write-Host "  2. Or: F12 → Network → 'Disable cache'" -ForegroundColor White
Write-Host "  3. Then: Right-click refresh → 'Empty Cache and Hard Reload'" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Start dev server
npm run dev
