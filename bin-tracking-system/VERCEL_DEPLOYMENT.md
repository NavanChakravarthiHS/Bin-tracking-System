# Vercel Deployment Guide - Smart Waste Bin Tracking System

## 🚀 Deploy to Vercel (Choose One Method)

### Method 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy the project:**
   ```bash
   cd "c:\Bin tracking System\bin-tracking-system"
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Yes**
   - Which scope? **Choose your account**
   - Link to existing project? **No**
   - Project name? **smart-bin-tracker** (or your choice)
   - In which directory is your code? **.**
   - Want to override settings? **No**

5. **Production deployment:**
   ```bash
   vercel --prod
   ```

---

### Method 2: Deploy via GitHub (Automatic)

1. **Push your code to GitHub:**
   ```bash
   cd "c:\Bin tracking System\bin-tracking-system"
   git init
   git add .
   git commit -m "Initial commit - Smart Waste Bin Tracker"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/smart-bin-tracker.git
   git push -u origin main
   ```

2. **Go to [Vercel.com](https://vercel.com)**

3. **Click "Add New Project"**

4. **Import your GitHub repository**

5. **Configure project:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add: `VITE_GOOGLE_MAPS_API_KEY` with your Google Maps API key

7. **Click "Deploy"**

---

### Method 3: Deploy via Vercel Dashboard

1. **Go to [vercel.com/new](https://vercel.com/new)**

2. **Click "Import Git Repository"** or **"Add New Project"**

3. **Configure:**
   - Name: `smart-bin-tracker`
   - Framework: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables** (see below)

5. **Deploy**

---

## 🔑 Environment Variables

### Required for Google Maps (Optional):

If you want the map feature to work, add this environment variable:

**Variable Name:** `VITE_GOOGLE_MAPS_API_KEY`  
**Value:** Your Google Maps API key

### How to Add Environment Variables:

**Via Vercel CLI:**
```bash
vercel env add VITE_GOOGLE_MAPS_API_KEY
```

**Via Vercel Dashboard:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `VITE_GOOGLE_MAPS_API_KEY`
4. Set value to your API key
5. Redeploy the project

---

## ⚙️ Project Configuration

The project is already configured with:

### ✅ vercel.json
- Automatic SPA routing (all routes go to index.html)
- Asset caching optimization
- Vite framework detection

### ✅ vite.config.js
- React plugin configured
- Production build optimizations

### ✅ package.json
- Build script: `vite build`
- Output directory: `dist`

---

## 🎯 Pre-Deployment Checklist

Before deploying, make sure:

- [ ] All dependencies are installed (`npm install`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Google Maps API key is added (if using maps)
- [ ] No console errors in development
- [ ] All routes work correctly

---

## 🧪 Test Production Build Locally

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

Open http://localhost:4173 to see the production version.

---

## 🌐 Custom Domain (Optional)

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to "Settings" > "Domains"**
4. **Add your custom domain**
5. **Configure DNS records** as instructed

---

## 📊 Post-Deployment

After successful deployment, you'll get:
- **Production URL:** `https://your-project.vercel.app`
- **Automatic HTTPS** enabled
- **Automatic deployments** on git push (if connected to GitHub)
- **Preview deployments** for every branch

---

## 🔧 Troubleshooting

### Build Fails?

**Check Node version:**
```bash
node --version  # Should be 18+
```

**Clear cache and rebuild:**
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Maps Not Working?

- Ensure `VITE_GOOGLE_MAPS_API_KEY` is set in Vercel environment variables
- Redeploy after adding the environment variable

### Routing Issues?

- The `vercel.json` file handles SPA routing
- Ensure it's committed to your repository

---

## 📈 Vercel Features You Get

✅ **Automatic CI/CD** - Deploy on every git push  
✅ **Preview Deployments** - Test before production  
✅ **Automatic HTTPS** - SSL certificates included  
✅ **Edge Network** - Fast global CDN  
✅ **Analytics** - Track visitor metrics  
✅ **Serverless Functions** - Add backend later if needed  
✅ **Environment Variables** - Secure configuration  

---

## 🎉 Your App is Live!

Once deployed, share your Smart Waste Bin Tracking System:
- Dashboard: `https://your-app.vercel.app/`
- Map: `https://your-app.vercel.app/map`
- Alerts: `https://your-app.vercel.app/alerts`

---

## 📝 Quick Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Remove deployment
vercel rm <deployment-url>
```

---

For more help, visit [Vercel Documentation](https://vercel.com/docs)
