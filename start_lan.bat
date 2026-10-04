@echo off
title Kigali Real Estate - LAN Mode
cd /d "%~dp0"
echo ========================================
echo   Kigali Real Estate - LAN Mode
echo ========================================
echo.
echo Starting services for LAN access...
echo Your LAN IP: 10.63.106.43
echo.
echo This will open multiple terminal windows.
echo Close them to stop services.
echo.
pause
echo.

:: Start Hardhat (blockchain)
start "Hardhat Node" cmd /c "cd /d blockchain && npx hardhat node --hostname 0.0.0.0"

timeout /t 5 /nobreak >nul

:: Start Backend
set FRONTEND_URL=http://localhost:3000,http://10.63.106.43:3000
start "Backend" cmd /c "cd /d backend && npx ts-node-dev --respawn --transpile-only src/index.ts"

timeout /t 3 /nobreak >nul

:: Start Frontend
set NEXT_PUBLIC_API_URL=http://10.63.106.43:5001/api
set NEXT_PUBLIC_API_BASE=http://10.63.106.43:5001
set NEXT_PUBLIC_HARDHAT_RPC=http://10.63.106.43:8545
set NEXT_PUBLIC_SEPOLIA_RPC=http://10.63.106.43:8545
set API_URL=http://127.0.0.1:5001
start "Frontend" cmd /c "cd /d frontend && npx next dev -H 0.0.0.0 -p 3000"

echo.
echo ========================================
echo   All services starting!
echo ========================================
echo.
echo  This machine:    http://localhost:3000
echo  Other machines:  http://10.63.106.43:3000
echo.
echo  MetaMask RPC:    http://10.63.106.43:8545
echo  Chain ID:        31337
echo.
echo  Close the terminal windows to stop.
echo.
pause
