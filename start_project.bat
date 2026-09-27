@echo off
title Landslide ICS - Early Warning System Launcher
echo ========================================================
echo   LANDSLIDE INTELLIGENCE COMMAND CENTER (SIH 2026)
echo ========================================================
echo.

echo [1/3] Starting Backend Server on port 3001...
start "Landslide Backend" cmd /k "cd /d backend && npm start"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend Vite Server on port 5173...
start "Landslide Frontend" cmd /k "cd /d frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening Command Center in your browser...
start http://localhost:5173

echo.
echo ========================================================
echo   Both services started! Keep the terminal windows open.
echo   Frontend URL: http://localhost:5173
echo   Backend URL:  http://localhost:3001
echo ========================================================
pause
