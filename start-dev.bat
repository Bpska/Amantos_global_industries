@echo off
title Amanta Global Industries - Dev Runner
color 0A

echo ===================================================
echo   Amanta Global Industries - Local Development
echo   Starting Backend (Port 5000) ^& Frontend (Port 5173)
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking and freeing ports 5000 and 5173 if busy...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo.
echo [2/3] Launching Express + PostgreSQL Backend on port 5000...
start "Backend API (Port 5000)" cmd /k "cd /d %~dp0\backend && npm run dev"

echo.
echo [3/3] Launching React + Vite Frontend on port 5173...
start "Frontend Web (Port 5173)" cmd /k "cd /d %~dp0\web && npm run dev"

echo.
echo ===================================================
echo   Services are running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000/health
echo ===================================================
pause
