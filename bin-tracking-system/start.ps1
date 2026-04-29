# EcoTrack - Start Server Script
# This script starts the EcoTrack backend server

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 Starting EcoTrack Server..." -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if node_modules exists
if (-Not (Test-Path "backend\node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "`n✅ Dependencies installed!`n" -ForegroundColor Green
}

# Start the server
Write-Host "🌐 Starting server on port 5000...`n" -ForegroundColor Yellow
Set-Location backend
npm run dev
