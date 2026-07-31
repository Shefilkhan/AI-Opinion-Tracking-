# Start OpinionPulse backend + frontend on Windows (PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Backend = Join-Path $Root "opinionpulse-backend"
$Frontend = Join-Path $Root "opinionpulse-frontend"

Write-Host "==> OpinionPulse dev stack" -ForegroundColor Cyan

# Backend env
$EnvLocal = Join-Path $Backend ".env.local"
if (-not (Test-Path $EnvLocal)) {
    Write-Host "Creating .env.local from .env.example ..."
    Copy-Item (Join-Path $Backend ".env.example") $EnvLocal
    Write-Host "Edit DB_PASSWORD in .env.local (XAMPP MySQL root password, often empty)."
}

# Python venv
$Venv = Join-Path $Backend ".venv"
if (-not (Test-Path $Venv)) {
    Write-Host "==> Creating Python venv ..."
    python -m venv $Venv
    & (Join-Path $Venv "Scripts\pip.exe") install -r (Join-Path $Backend "requirements.txt")
}

# Frontend deps
if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
    Write-Host "==> Installing frontend dependencies ..."
    Push-Location $Frontend
    npm install
    Pop-Location
}

Write-Host ""
Write-Host "Ensure XAMPP MySQL is running (port 3306)." -ForegroundColor Yellow
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Frontend: http://127.0.0.1:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Open TWO terminals, or run this script in two windows:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 1 (backend):" -ForegroundColor White
Write-Host "    cd $Backend"
Write-Host "    .\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000"
Write-Host ""
Write-Host "  Terminal 2 (frontend):" -ForegroundColor White
Write-Host "    cd $Frontend"
Write-Host "    npm run dev"
Write-Host ""
