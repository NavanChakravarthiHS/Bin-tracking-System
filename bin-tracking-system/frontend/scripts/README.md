# Deployment Scripts

This directory contains scripts for deploying the application to Vercel.

## 📜 Available Scripts

### Windows (PowerShell)
**`deploy.ps1`** - Automated deployment script for Windows

```powershell
.\scripts\deploy.ps1
```

### Linux/Mac (Bash)
**`deploy.sh`** - Automated deployment script for Linux/Mac

```bash
./scripts/deploy.sh
```

## 🔧 What These Scripts Do

1. ✅ Check if Vercel CLI is installed
2. ✅ Build the production version
3. ✅ Deploy to Vercel with one command

## 📋 Prerequisites

Before running the scripts:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Make script executable (Linux/Mac only):**
   ```bash
   chmod +x scripts/deploy.sh
   ```

## 🚀 Quick Deploy

After prerequisites:

**Windows:**
```powershell
.\scripts\deploy.ps1
```

**Linux/Mac:**
```bash
./scripts/deploy.sh
```

## 📖 Manual Deployment

If you prefer manual deployment:

```bash
# Build
npm run build

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 🔑 Environment Variables

If using Google Maps, add your API key before deploying:

```bash
vercel env add VITE_GOOGLE_MAPS_API_KEY
```

## ⚠️ Troubleshooting

**Script not found?**
- Make sure you're in the project root directory
- Check that the `scripts/` directory exists

**Permission denied (Linux/Mac)?**
```bash
chmod +x scripts/deploy.sh
```

**Vercel CLI not installed?**
```bash
npm install -g vercel
```

## 📚 More Information

- **Quick Start:** See [docs/DEPLOY_NOW.md](../docs/DEPLOY_NOW.md)
- **Full Guide:** See [docs/VERCEL_DEPLOYMENT.md](../docs/VERCEL_DEPLOYMENT.md)
- **Checklist:** See [docs/DEPLOYMENT_CHECKLIST.md](../docs/DEPLOYMENT_CHECKLIST.md)
