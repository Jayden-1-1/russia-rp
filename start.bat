@echo off
setlocal enabledelayedexpansion
title RUSSIA RP - Digital Experience

cd /d "%~dp0"

echo ============================================================
echo   RUSSIA RP - DIGITAL EXPERIENCE
echo ============================================================
echo.

REM ---- Check Node.js ----
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

REM ---- Install dependencies on first run ----
if not exist "node_modules" (
    echo [1/4] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
) else (
    echo [1/4] Dependencies OK.
)

REM ---- Create .env on first run ----
if not exist ".env" (
    echo [2/5] Creating .env from template...
    copy ".env.example" ".env" >nul
    echo       Set ROOT_LOGIN / ROOT_PASSWORD / SESSION_SECRET in .env.
) else (
    echo [2/5] .env found.
)

REM ---- Apply database migrations ----
echo [3/5] Applying database migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo [WARN] prisma migrate deploy failed. Trying prisma db push...
    call npx prisma db push
)

REM ---- Seed question variants (idempotent) ----
echo [4/5] Seeding question variants...
call npx tsx scripts/seed-variants.ts
if errorlevel 1 (
    echo [WARN] Seeding skipped.
)

REM ---- Find a free port (3000 is often taken by other apps) ----
echo [5/5] Looking for a free port...
set "PORT="
for %%P in (3002 3003 3004 3005 3100 3200 3300) do (
    if not defined PORT (
        netstat -an | findstr /r /c:":%%P .*LISTENING" >nul 2>&1
        if errorlevel 1 (
            set "PORT=%%P"
        )
    )
)
if not defined PORT set "PORT=3999"

echo.
echo ============================================================
echo   Starting server at:  http://localhost:!PORT!
echo   Port 3000 is NOT used ^(it is busy with other apps^).
echo   Press Ctrl+C to stop.
echo ============================================================
echo.

REM ---- Open browser after the server is up (background) ----
start "" /min cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:!PORT!"

REM ---- Run the dev server on the chosen port ----
set "PORT=!PORT!"
call npm run dev -- --port !PORT!

pause
