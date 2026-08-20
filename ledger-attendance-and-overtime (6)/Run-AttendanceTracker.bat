@echo off
setlocal enabledelayedexpansion
title Wadi Degla Clubs - Attendance and Overtime Tracker
cd /d "%~dp0"

echo ====================================================================
echo    Wadi Degla Clubs - Attendance and Overtime Tracker
echo ====================================================================
echo.

:: Remove old status files
if exist "%~dp0.active_port" del /f /q "%~dp0.active_port" >nul 2>nul
if exist "%~dp0.network_info.json" del /f /q "%~dp0.network_info.json" >nul 2>nul

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [*] Node.js detected. Starting web server...
    start /b "" node "%~dp0server.js"
    goto :WAIT
)

:: Fallback: PowerShell server
echo [*] Starting built-in Windows PowerShell server...
start /b "" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

:WAIT
echo [*] Waiting for server to start...
set "APP_PORT=3000"
set "WAITED=0"

:WAIT_LOOP
if %WAITED% geq 15 goto :SERVER_BOUND
if exist "%~dp0.active_port" (
    set /p APP_PORT=<"%~dp0.active_port"
    goto :SERVER_BOUND
)
timeout /t 1 /nobreak >nul 2>nul
set /a WAITED+=1
goto :WAIT_LOOP

:SERVER_BOUND
set "TARGET_URL=http://localhost:!APP_PORT!"
set "NETWORK_URL="

if exist "%~dp0.network_info.json" (
    for /f "usebackq tokens=2 delims=:, " %%A in (`type "%~dp0.network_info.json" ^| findstr /i "primaryIp"`) do (
        set "RAW_IP=%%~A"
        set "RAW_IP=!RAW_IP: =!"
        set "RAW_IP=!RAW_IP:"=!"
        if not "!RAW_IP!"=="127.0.0.1" (
            set "NETWORK_URL=http://!RAW_IP!:!APP_PORT!"
        )
    )
)

echo.
echo ====================================================================
echo   APP IS RUNNING - OPEN IN YOUR BROWSER:
echo.
echo   This computer:  !TARGET_URL!
if not "!NETWORK_URL!"=="" (
echo.
echo   Other devices on Wi-Fi or office network:
echo   !NETWORK_URL!
)
echo ====================================================================
echo.

:: Try Edge first
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="!TARGET_URL!" --window-size=1300,900
    goto :DONE
)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app="!TARGET_URL!" --window-size=1300,900
    goto :DONE
)

:: Try Chrome
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="!TARGET_URL!" --window-size=1300,900
    goto :DONE
)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app="!TARGET_URL!" --window-size=1300,900
    goto :DONE
)

:: Default browser fallback
start "" "!TARGET_URL!"

:DONE
echo Keep this window open while you use the application.
echo Close this window to stop the server.
echo.
pause >nul
exit /b
