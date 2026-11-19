# Amanta Global Industries - One-Click Launcher for Windows PowerShell
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Amanta Global Industries - Dev Runner" -ForegroundColor Green
Write-Host "  Starting Backend (:5000) & Frontend (:5173)" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Clear any stuck processes on 5000 and 5173
Write-Host "`n[1/3] Checking ports 5000 and 5173..." -ForegroundColor Gray
Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 2. Launch Backend in a new terminal window
Write-Host "[2/3] Starting Backend API on http://localhost:5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$rootDir\backend`"; npm run dev"

# 3. Launch Frontend in a new terminal window
Write-Host "[3/3] Starting Frontend Web on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$rootDir\web`"; npm run dev"

Write-Host "`nAll services launched successfully!" -ForegroundColor Green
Write-Host "Frontend : http://localhost:5173" -ForegroundColor White
Write-Host "Backend  : http://localhost:5000" -ForegroundColor White
Write-Host "===================================================`n" -ForegroundColor Cyan
