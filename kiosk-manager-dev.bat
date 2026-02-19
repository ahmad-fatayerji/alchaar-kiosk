@echo off
setlocal
cd /d "%~dp0"
rem Launch the DEV PowerShell menu with ExecutionPolicy bypass so it works by double-click
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\kiosk-menu-dev.ps1"
endlocal
