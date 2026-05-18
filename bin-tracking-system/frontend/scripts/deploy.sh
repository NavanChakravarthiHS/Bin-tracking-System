#!/bin/bash
# Quick Deploy to Vercel Script
# Prerequisites: Node.js, npm

echo "🚀 EcoTrack - Smart Waste Bin Tracker"
echo "======================================"
echo ""

# Check if Node.js is installed
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo ""
    echo "Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION detected"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI"
        exit 1
    fi
    echo "✅ Vercel CLI installed"
else
    echo "✅ Vercel CLI detected"
fi

echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""

# Build the project
echo "🔨 Building production version..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Check if logged in to Vercel
echo "🔐 Checking Vercel authentication..."
vercel whoami

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Not logged in to Vercel"
    echo "🔑 Please login to Vercel..."
    vercel login
    
    if [ $? -ne 0 ]; then
        echo "❌ Login failed"
        exit 1
    fi
fi

echo ""
echo "🌐 Deploying to Vercel..."
echo ""

# Deploy to production
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "📱 Your app is now live on Vercel"
    echo ""
    echo "💡 Next steps:"
    echo "  1. Test your live URL"
    echo "  2. Add Google Maps API key (optional)"
    echo "  3. Configure custom domain (optional)"
else
    echo "❌ Deployment failed"
    exit 1
fi
