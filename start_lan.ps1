param(
    [string]$LanIP = "10.63.106.43"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Kigali Real Estate (LAN)" -ForegroundColor Cyan
Write-Host "  LAN IP: $LanIP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure we're in the project root
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# ── 1. Firewall rules ──
$rules = @(
    @{Name="Kigali-RealEstate-Frontend"; Port=3000; Desc="Next.js Frontend"},
    @{Name="Kigali-RealEstate-Backend"; Port=5001; Desc="Express API"},
    @{Name="Kigali-RealEstate-Blockchain"; Port=8545; Desc="Hardhat Node"}
)
foreach ($r in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Protocol TCP -LocalPort $r.Port -Action Allow | Out-Null
        Write-Host "  [FIREWALL] Added rule '$($r.Name)' for port $($r.Port)" -ForegroundColor Yellow
    } else {
        Write-Host "  [FIREWALL] Rule '$($r.Name)' already exists" -ForegroundColor Green
    }
}

# ── 2. Verify services ──
# Check MySQL
$mysql = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if (-not $mysql) {
    Write-Host "  [WARN] MySQL process not found. Make sure MySQL is running on port 3306." -ForegroundColor Yellow
} else {
    Write-Host "  [OK] MySQL is running (PID: $($mysql.Id))" -ForegroundColor Green
}

# ── 3. Start services ──
$projectRoot = $root
$logDir = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start Hardhat (blockchain)
Write-Host "  Starting Hardhat node (port 8545)..." -ForegroundColor Magenta
$blockchainLog = Join-Path $logDir "blockchain.log"
$blockchainJob = Start-Job -ScriptBlock {
    param($dir, $log)
    Set-Location $dir
    & "npx.cmd" "hardhat" "node" "--hostname" "0.0.0.0" 2>&1 | Out-File -FilePath $log -Encoding utf8
} -ArgumentList (Join-Path $root "blockchain"), $blockchainLog

Start-Sleep -Seconds 2

# Start Backend
Write-Host "  Starting Backend (port 5001)..." -ForegroundColor Magenta
$backendLog = Join-Path $logDir "backend.log"
$env:PORT = "5001"
$env:FRONTEND_URL = "http://${LanIP}:3000"
$env:BLOCKCHAIN_RPC_URL = "http://127.0.0.1:8545"
$env:BLOCKCHAIN_WS_URL = "ws://127.0.0.1:8545"
$env:NODE_ENV = "development"
$backendJob = Start-Job -ScriptBlock {
    param($dir, $log)
    Set-Location $dir
    & "npx.cmd" "ts-node-dev" "--respawn" "--transpile-only" "src/index.ts" 2>&1 | Out-File -FilePath $log -Encoding utf8
} -ArgumentList (Join-Path $root "backend"), $backendLog

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "  Starting Frontend (port 3000)..." -ForegroundColor Magenta
$frontendLog = Join-Path $logDir "frontend.log"
$env:NEXT_PUBLIC_API_URL = "http://${LanIP}:5001/api"
$env:NEXT_PUBLIC_API_BASE = "http://${LanIP}:5001"
$env:NEXT_PUBLIC_HARDHAT_RPC = "http://${LanIP}:8545"
$env:NEXT_PUBLIC_SEPOLIA_RPC = "http://${LanIP}:8545"
$env:API_URL = "http://127.0.0.1:5001"
$frontendJob = Start-Job -ScriptBlock {
    param($dir, $log, $apiUrl)
    Set-Location $dir
    $env:API_URL = $apiUrl
    & "npx.cmd" "next" "dev" "-H" "0.0.0.0" "-p" "3000" 2>&1 | Out-File -FilePath $log -Encoding utf8
} -ArgumentList (Join-Path $root "frontend"), $frontendLog, "http://127.0.0.1:5001"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Access from THIS machine:" -ForegroundColor White
Write-Host "    Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "    Backend:  http://localhost:5001/api" -ForegroundColor Cyan
Write-Host "    Chain:    http://localhost:8545" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Access from OTHER machines on LAN:" -ForegroundColor White
Write-Host "    Frontend: http://${LanIP}:3000" -ForegroundColor Cyan
Write-Host "    Backend:  http://${LanIP}:5001/api" -ForegroundColor Cyan
Write-Host "    Chain:    http://${LanIP}:8545" -ForegroundColor Cyan
Write-Host ""
Write-Host "  MetaMask config on other machines:" -ForegroundColor White
Write-Host "    Network Name: Hardhat Local" -ForegroundColor Cyan
Write-Host "    RPC URL:      http://${LanIP}:8545" -ForegroundColor Cyan
Write-Host "    Chain ID:     31337" -ForegroundColor Cyan
Write-Host "    Currency:     ETH" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Test accounts (10000 ETH each):" -ForegroundColor White
Write-Host "    #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" -ForegroundColor Cyan
Write-Host "    #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Logs: $logDir" -ForegroundColor Gray
Write-Host ""
Write-Host "  Press Ctrl+C to stop monitoring (services continue in background)" -ForegroundColor Yellow
Write-Host "  To stop all services: Get-Job | Stop-Job" -ForegroundColor Yellow
Write-Host ""

# Monitor output
while ($true) {
    Start-Sleep -Seconds 30
    # Check if jobs are still running
    $running = @(Get-Job -State Running).Count
    if ($running -eq 0) {
        Write-Host "[ERROR] All services stopped unexpectedly. Check logs in $logDir" -ForegroundColor Red
        break
    }
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Services running: $running" -ForegroundColor Gray
}
