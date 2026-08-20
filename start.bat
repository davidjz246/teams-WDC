@echo off
title Wadi Degla Attendance & Overtime Tracker
cls
echo ========================================================
echo   Wadi Degla Clubs Attendance & Overtime System
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [Notice] Node.js is not found in your PATH.
    echo Launching compiled production app in your default browser...
    start "" "%~dp0dist\index.html"
    pause
    exit /b
)

echo Starting Attendance Tracker Localhost Development Server...
echo.
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

start "" http://localhost:3000
call npm run dev
pause
