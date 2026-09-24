# ==============================================================================
# MediScribe AI - College Expo / Demo Startup Script (Windows PowerShell)
# ==============================================================================

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "🩺 MediScribe AI - AI Clinical Documentation & Hospital Copilot" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Starting application in 100% Offline-Safe DEMO MODE..." -ForegroundColor Yellow

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

# 1. Setup Backend
Set-Location $BackendDir
if (-not (Test-Path ".venv")) {
    Write-Host "📦 Creating Python virtual environment..." -ForegroundColor Green
    python -m venv .venv
    & .\.venv\Scripts\pip.exe install --upgrade pip
    & .\.venv\Scripts\pip.exe install -r requirements.txt
}

Write-Host "🌱 Initializing and seeding synthetic patient data..." -ForegroundColor Green
& .\.venv\Scripts\python.exe -m app.db.seed

# 2. Setup Frontend
Set-Location $FrontendDir
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Green
    npm install
}

Write-Host ""
Write-Host "🚀 Starting MediScribe AI Services..." -ForegroundColor Green
Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "🌐 Frontend URL:      http://localhost:5173" -ForegroundColor White
Write-Host "🔌 Backend API:       http://localhost:8000" -ForegroundColor White
Write-Host "📚 Swagger API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "🔑 Demo Credentials:" -ForegroundColor Yellow
Write-Host "   Doctor:          doctor@demo.com  /  doctor123"
Write-Host "   Hospital Admin:  admin@demo.com   /  admin123"
Write-Host "   Sample Patient:  P1001 (Rahul Nair - Malayalam/Eng Fever Demo)"
Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan

# Start servers in separate jobs or background
Start-Process -NoNewWindow -FilePath ".\.venv\Scripts\uvicorn.exe" -ArgumentList "app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $BackendDir
Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList "run dev -- --host 127.0.0.1 --port 5173" -WorkingDirectory $FrontendDir

Write-Host "Servers launched. Open http://localhost:5173 in your browser." -ForegroundColor Green
