# 🚀 Deploy to Vercel - Quick Start

## Option 1: One-Click Deploy (Fastest) ⚡

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Done!** You'll get a live URL like: `https://smart-bin-tracker.vercel.app`

---

## Option 2: Use Deployment Script 📜

**Windows:**
```powershell
.\deploy.ps1
```

**Linux/Mac:**
```bash
./deploy.sh
```

---

## Option 3: GitHub Auto-Deploy 🔄

1. Push code to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Auto-deploys on every push!

---

## Optional: Add Google Maps API Key

```bash
vercel env add VITE_GOOGLE_MAPS_API_KEY
# Enter your API key when prompted
vercel --prod
```

---

## Verify Deployment

✅ Visit your production URL  
✅ Test all pages: Dashboard, Map, Alerts  
✅ Try search and filter  
✅ Toggle dark mode  

---

## Need Help?

📖 **Full Guide:** [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)  
✅ **Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)  

---

**That's it! Your Smart Waste Bin Tracker is now live! 🎉**
