# Quick Deploy to Vercel Script (Windows PowerShell)
# Prerequisites: Node.js, npm

Write-Host "🚀 EcoTrack - Smart Waste Bin Tracker" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeInstalled) {
    Write-Host "❌ Node.js is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = node --version
Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "📦 Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI detected" -ForegroundColor Green
}

Write-Host ""

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# Build the project
Write-Host "🔨 Building production version..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Check if logged in to Vercel
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Yellow
vercel whoami

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  Not logged in to Vercel" -ForegroundColor Yellow
    Write-Host "🔑 Please login to Vercel..." -ForegroundColor Yellow
    vercel login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Deploy to production
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
    Write-Host "📱 Your app is now live on Vercel" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test your live URL" -ForegroundColor White
    Write-Host "  2. Add Google Maps API key (optional)" -ForegroundColor White
    Write-Host "  3. Configure custom domain (optional)" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}
