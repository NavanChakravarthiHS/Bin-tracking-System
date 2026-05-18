# EcoTrack - Start Server Script
# This script starts both the EcoTrack frontend and backend concurrently

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 Starting EcoTrack Workspace..." -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if root node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Installing workspace root dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if frontend node_modules exists
if (-Not (Test-Path "frontend\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Check if backend node_modules exists
if (-Not (Test-Path "backend\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

Write-Host "`n✅ Dependencies verified!`n" -ForegroundColor Green

# Start both servers
Write-Host "🌐 Starting frontend and backend concurrently...`n" -ForegroundColor Yellow
npm run dev
