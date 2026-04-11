# 📁 Project Directory Structure

This document provides a comprehensive overview of the Smart Waste Bin Tracking System directory structure.

## 🌳 Complete Directory Tree

```
bin-tracking-system/
│
├── 📁 src/                              # Application Source Code
│   ├── 📁 components/                   # Reusable React Components
│   │   ├── 📁 Layout/                   # Layout Components
│   │   │   └── Navbar.jsx               # Main navigation bar
│   │   ├── 📁 Dashboard/                # Dashboard Components
│   │   │   ├── Dashboard.jsx            # Dashboard grid container
│   │   │   └── BinCard.jsx              # Individual bin card
│   │   ├── 📁 Map/                      # Map Components
│   │   │   └── MapView.jsx              # Google Maps integration
│   │   ├── 📁 Alerts/                   # Alert Components
│   │   │   └── Alerts.jsx               # Alert notifications list
│   │   ├── 📁 Common/                   # Shared/Utility Components
│   │   │   ├── SearchBar.jsx            # Search input component
│   │   │   ├── FilterBar.jsx            # Filter buttons component
│   │   │   ├── LoadingSpinner.jsx       # Loading indicator
│   │   │   └── StatusBadge.jsx          # Status badge component
│   │   └── 📁 Theme/                    # Theme Components
│   │       └── ThemeToggle.jsx          # Dark mode toggle
│   │
│   ├── 📁 data/                         # Data Files
│   │   └── mockData.js                  # Mock bin data (12 bins)
│   │
│   ├── 📁 hooks/                        # Custom React Hooks
│   │   └── useBins.js                   # Bin state management hook
│   │
│   ├── 📁 pages/                        # Page Components
│   │   ├── DashboardPage.jsx            # Dashboard page
│   │   ├── MapPage.jsx                  # Map page
│   │   └── AlertsPage.jsx               # Alerts page
│   │
│   ├── 📁 utils/                        # Utility Functions
│   │   └── helpers.js                   # Helper functions
│   │
│   ├── 📄 App.jsx                       # Main application component
│   ├── 📄 main.jsx                      # Application entry point
│   └── 📄 index.css                     # Global styles (Tailwind)
│
├── 📁 public/                           # Static Assets
│   ├── favicon.svg                      # Favicon
│   └── icons.svg                        # Icon sprites
│
├── 📁 dist/                             # Production Build Output (generated)
│   ├── 📁 assets/                       # Bundled JS and CSS
│   ├── index.html                       # Production HTML
│   └── ...                              # Other static files
│
├── 📁 docs/                             # Documentation
│   ├── INDEX.md                         # Documentation index
│   ├── QUICKSTART.md                    # Quick start guide
│   ├── DEPLOY_NOW.md                    # Quick deployment guide
│   ├── VERCEL_DEPLOYMENT.md             # Comprehensive deployment guide
│   └── DEPLOYMENT_CHECKLIST.md          # Deployment checklist
│
├── 📁 scripts/                          # Deployment Scripts
│   ├── README.md                        # Scripts documentation
│   ├── deploy.ps1                       # Windows PowerShell deploy script
│   └── deploy.sh                        # Linux/Mac Bash deploy script
│
├── 📁 config/                           # Configuration Files
│   ├── README.md                        # Config documentation
│   └── vercel.json                      # Vercel deployment config
│
├── 📄 .env                              # Environment variables (local, not committed)
├── 📄 .env.example                      # Environment variables template
├── 📄 .gitignore                        # Git ignore rules
│
├── 📄 package.json                      # Project dependencies and scripts
├── 📄 package-lock.json                 # Locked dependency versions
│
├── 📄 vite.config.js                    # Vite build configuration
├── 📄 tailwind.config.js                # Tailwind CSS configuration
├── 📄 postcss.config.js                 # PostCSS configuration
├── 📄 eslint.config.js                  # ESLint linting configuration
│
├── 📄 index.html                        # HTML entry point
├── 📄 README.md                         # Main project documentation
└── 📄 DIRECTORY_STRUCTURE.md            # This file
```

## 📂 Directory Descriptions

### Core Directories

#### `src/` - Source Code
Contains all application source code organized by feature and type.

**Subdirectories:**
- `components/` - Reusable React components organized by feature
- `data/` - Mock data and static data files
- `hooks/` - Custom React hooks for state management
- `pages/` - Top-level page components for routing
- `utils/` - Utility and helper functions

#### `public/` - Static Assets
Static files that are served as-is without processing.
- Images, favicons, and other assets
- Files here are copied directly to the `dist/` folder

#### `dist/` - Distribution (Build Output)
Generated production build (not committed to Git).
- Created by running `npm run build`
- Contains optimized, minified, and bundled files
- Deployed to Vercel or other hosting platforms

### Documentation

#### `docs/` - Documentation
All project documentation files.
- **INDEX.md** - Start here for documentation navigation
- **QUICKSTART.md** - Get started running locally
- **DEPLOY_NOW.md** - Quick deployment guide
- **VERCEL_DEPLOYMENT.md** - Full deployment documentation
- **DEPLOYMENT_CHECKLIST.md** - Pre/post deployment checklist

### Scripts & Configuration

#### `scripts/` - Deployment Scripts
Automated deployment scripts for different platforms.
- **deploy.ps1** - Windows PowerShell script
- **deploy.sh** - Linux/Mac Bash script
- Both scripts build and deploy to Vercel automatically

#### `config/` - Configuration Files
Deployment and tool configurations.
- **vercel.json** - Vercel deployment settings
- Note: Build tool configs (Vite, Tailwind, etc.) remain at root as required

### Root Configuration Files

These files must remain at the project root for tools to work properly:

- **vite.config.js** - Vite build tool configuration
- **tailwind.config.js** - Tailwind CSS framework configuration
- **postcss.config.js** - PostCSS processor configuration
- **eslint.config.js** - ESLint code linter configuration
- **package.json** - NPM package manifest and scripts
- **index.html** - HTML entry point for the application

### Environment Files

- **`.env`** - Local environment variables (NOT committed to Git)
- **`.env.example`** - Template for environment variables
- **`.gitignore`** - Specifies files to exclude from Git

## 🎯 Key File Locations

### To modify application features:
- **Dashboard:** `src/components/Dashboard/`
- **Map:** `src/components/Map/`
- **Alerts:** `src/components/Alerts/`
- **Navigation:** `src/components/Layout/Navbar.jsx`

### To customize styling:
- **Global styles:** `src/index.css`
- **Tailwind config:** `tailwind.config.js`
- **Theme colors:** `tailwind.config.js` → `theme.extend.colors`

### To add/modify data:
- **Mock data:** `src/data/mockData.js`
- **API integration:** `src/hooks/useBins.js`

### To deploy:
- **Quick deploy:** Run `scripts/deploy.ps1` or `scripts/deploy.sh`
- **Vercel config:** `config/vercel.json`
- **Environment vars:** `.env` (local) or Vercel dashboard

### To build for production:
```bash
npm run build
```
Output will be in `dist/` folder.

## 📊 File Organization Principles

The project follows these organization principles:

1. **Separation of Concerns** - Code organized by feature and type
2. **Co-location** - Related files kept together
3. **Clear Hierarchy** - Obvious file locations based on purpose
4. **Documentation** - Every directory has a README if needed
5. **Build Tool Requirements** - Config files where tools expect them

## 🔍 Quick Navigation

| I want to... | Go to... |
|--------------|----------|
| Run the app locally | See [docs/QUICKSTART.md](./docs/QUICKSTART.md) |
| Deploy to Vercel | See [docs/DEPLOY_NOW.md](./docs/DEPLOY_NOW.md) |
| Modify bin data | `src/data/mockData.js` |
| Change UI components | `src/components/` |
| Add new pages | `src/pages/` |
| Customize styles | `src/index.css` + `tailwind.config.js` |
| Configure deployment | `config/vercel.json` |
| View documentation | `docs/INDEX.md` |

## 📝 Notes

- **Build tool configs** (Vite, Tailwind, PostCSS, ESLint) must stay at root
- **`dist/` folder** is generated and should not be manually edited
- **`.env` files** contain sensitive data and are not committed to Git
- **Documentation** is centralized in the `docs/` directory
- **Scripts** are organized in the `scripts/` directory with their own README

---

**Last Updated:** April 11, 2026  
**Project Version:** 1.0.0
