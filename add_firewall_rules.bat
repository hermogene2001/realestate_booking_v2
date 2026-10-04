@echo off
title Kigali Firewall Rules
cd /d "%~dp0"

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting administrator privileges...
    powershell -Command "Start-Process cmd -ArgumentList '/c cd /d \"%~dp0\" && %~nx0' -Verb RunAs"
    exit /b
)

echo Adding firewall rules for Kigali Real Estate...
echo.

netsh advfirewall firewall add rule name="Kigali-RealEstate-Frontend" dir=in action=allow protocol=TCP localport=3000
echo   Frontend (3000): %errorlevel%

netsh advfirewall firewall add rule name="Kigali-RealEstate-Backend" dir=in action=allow protocol=TCP localport=5001
echo   Backend (5001): %errorlevel%

netsh advfirewall firewall add rule name="Kigali-RealEstate-Blockchain" dir=in action=allow protocol=TCP localport=8545
echo   Blockchain (8545): %errorlevel%

echo.
echo Done. Press any key to exit.
pause >nul
