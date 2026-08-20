@echo off
title Share Attendance Tracker Online (Public Link)
cd /d "%~dp0"
echo ====================================================================
echo      Wadi Degla Attendance Tracker - Public Online Sharing
echo ====================================================================
echo.
echo Starting local application server...
start /b "" node "%~dp0server.js" >nul 2>nul

echo Generating temporary secure public HTTPS link...
echo (Anyone anywhere in the world can open this link)
echo.
call npx -y localtunnel --port 3000
pause
