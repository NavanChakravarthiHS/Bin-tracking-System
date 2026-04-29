# 🚀 EcoTrack - Quick Start Guide

## Integrated Single-Port Setup

Everything now runs on **ONE port (5000)** - no need to start separate servers!

---

## 🎯 How to Run

### Option 1: Quick Start (Recommended)

```bash
# Navigate to backend folder
cd backend

# Install dependencies (first time only)
npm install

# Start the server
npm run dev
```

### Option 2: Using PowerShell Script

```powershell
# Run from project root
.\start.ps1
```

---

## 🌐 Access Points

Once the server is running on **port 5000**, you can access:

| Page | URL |
|------|-----|
| **🏠 Landing Page** | http://localhost:5000/ |
| **👤 Admin Login** | http://localhost:5000/admin-login.html |
| **🚛 Collector Login** | http://localhost:5000/collector-login-new.html |
| **📊 Collector Dashboard** | http://localhost:5000/collector-dashboard.html |
| **✅ Health Check** | http://localhost:5000/health |

---

## 🔑 Default Login Credentials

### Admin Login
- **Mobile:** 9876543210
- **Password:** admin123

### Collector Login
- Create a new account at: http://localhost:5000/collector-signup.html
- Or use existing credentials if you've already signed up

---

## 📁 Project Structure

```
bin-tracking-system/
├── backend/                    # Backend server (Express + MongoDB)
│   ├── src/
│   │   ├── server.js          # Main server file (serves everything)
│   │   ├── routes/            # API routes
│   │   ├── models/            # Database models
│   │   └── ...
│   └── package.json
├── public/                     # Static HTML/CSS/JS files
│   ├── landing-page.html       # Landing page
│   ├── admin-login.html        # Admin login
│   ├── collector-login-new.html # Collector login (new design)
│   ├── collector-dashboard.html # Collector dashboard
│   ├── collector-dashboard.js
│   ├── collector-dashboard.css
│   └── ecotrack-theme.css      # Shared theme
└── src/                        # React app (for admin dashboard)
    └── ...
```

---

## 🎨 Features

✅ **Single Port** - Everything runs on port 5000  
✅ **No CORS Issues** - Same origin for frontend and backend  
✅ **Professional UI** - Dashboard-matched design  
✅ **Mobile Responsive** - Works on all devices  
✅ **Real-time Sync** - Admin and collector dashboards sync automatically  
✅ **Auto-refresh** - 5s polling for live updates  

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Not Running
```bash
# Make sure MongoDB is installed and running
# Check MongoDB service status
```

### Can't Access Pages
1. Make sure backend is running (`npm run dev`)
2. Check console for errors
3. Visit http://localhost:5000/health to verify server is up

---

## 🎯 Next Steps

1. **Start the server**
2. **Visit landing page:** http://localhost:5000/
3. **Login as admin** or **collector**
4. **Explore the dashboard!**

---

## 📞 Need Help?

Check the console logs when starting the server - it will show all available URLs!

```
========================================
🚀 EcoTrack Server Running!
========================================
📡 Backend API: http://localhost:5000
🏠 Landing Page: http://localhost:5000/
👤 Admin Login: http://localhost:5000/admin-login.html
🚛 Collector Login: http://localhost:5000/collector-login-new.html
📊 Collector Dashboard: http://localhost:5000/collector-dashboard.html
✅ Health Check: http://localhost:5000/health
========================================
```
