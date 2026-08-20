@echo off
title Wadi Degla Attendance Tracker
cls

set "TARGET_HTML=%~dp0app.html"
if not exist "%TARGET_HTML%" (
    set "TARGET_HTML=%~dp0dist\index.html"
)

if not exist "%TARGET_HTML%" (
    echo [Error] app.html or dist\index.html not found in %~dp0
    pause
    exit /b
)

:: Try Microsoft Edge native app mode
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="file:///%TARGET_HTML:\=/%" --window-size=1300,900
    exit /b
)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app="file:///%TARGET_HTML:\=/%" --window-size=1300,900
    exit /b
)

:: Try Google Chrome native app mode
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="file:///%TARGET_HTML:\=/%" --window-size=1300,900
    exit /b
)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app="file:///%TARGET_HTML:\=/%" --window-size=1300,900
    exit /b
)

:: Fallback to default browser
start "" "%TARGET_HTML%"
