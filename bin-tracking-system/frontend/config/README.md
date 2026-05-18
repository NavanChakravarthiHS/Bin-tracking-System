# Configuration Files

This directory contains deployment and build configuration files.

## 📁 Configuration Files

### Deployment
- **`vercel.json`** - Vercel deployment configuration
  - SPA routing rules
  - Asset caching headers
  - Framework detection

### Build Tools (Required at Root)
The following files must remain at the project root for the build tools to work:
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration  
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint configuration

## 🔧 Vercel Configuration

The `vercel.json` file configures:
- Automatic SPA routing (all routes → index.html)
- Asset caching for optimal performance
- Vite framework detection

## 📝 Notes

- Build tool configurations (Vite, Tailwind, PostCSS, ESLint) are kept at the project root as required by these tools
- Deployment-specific configurations are stored in this `config/` directory
- Environment variables should be set in Vercel dashboard or `.env` files (not committed)
