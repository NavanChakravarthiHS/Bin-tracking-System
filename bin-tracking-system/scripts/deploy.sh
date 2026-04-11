#!/bin/bash
# Quick Deploy to Vercel Script

echo "🚀 Smart Waste Bin Tracker - Vercel Deployment"
echo "================================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo ""
    echo "Install it with:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

# Build the project first
echo "📦 Building production version..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🌐 Deploying to Vercel..."
    echo ""
    vercel --prod
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi
