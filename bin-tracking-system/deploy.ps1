# Quick Deploy to Vercel Script (Windows PowerShell)

Write-Host "🚀 Smart Waste Bin Tracker - Vercel Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install it with:" -ForegroundColor Yellow
    Write-Host "  npm install -g vercel" -ForegroundColor Green
    Write-Host ""
    exit 1
}

# Build the project first
Write-Host "📦 Building production version..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Cyan
    Write-Host ""
    vercel --prod
} else {
    Write-Host "❌ Build failed. Please fix the errors and try again." -ForegroundColor Red
    exit 1
}
