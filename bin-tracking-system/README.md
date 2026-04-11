# Smart Waste Bin Tracking System

A modern, responsive React.js frontend application for tracking smart waste bins with real-time status visualization, interactive maps, and alert management.

**[🌐 Deploy on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/smart-bin-tracker)** | **[📖 Deployment Guide](VERCEL_DEPLOYMENT.md)**

## Features

- **Dashboard**: Grid layout displaying all waste bins with fill levels, status indicators, and color-coded cards
- **Interactive Map**: Google Maps integration showing bin locations with color-coded markers
- **Alerts Management**: Real-time alerts for full bins with dismiss functionality
- **Search & Filter**: Search bins by ID or location, filter by status (All, Normal, Warning, Full)
- **Dark Mode**: Toggle between light and dark themes with persistent preferences
- **Responsive Design**: Mobile-first approach with full mobile support
- **Smooth Animations**: Fade-in effects, hover animations, and smooth transitions

## Tech Stack

- **React 18** with functional components and hooks
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Google Maps React** for map integration
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Maps API Key (for map functionality)

### Installation

1. Clone the repository or navigate to the project directory:
   ```bash
   cd bin-tracking-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Add your Google Maps API key to `.env`:
     ```
     VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Getting a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Maps JavaScript API"
4. Go to "Credentials" and create an API key
5. Copy the API key to your `.env` file

## Project Structure

```
bin-tracking-system/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── Navbar.jsx     # Navigation bar
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx  # Dashboard grid
│   │   │   └── BinCard.jsx    # Individual bin card
│   │   ├── Map/
│   │   │   └── MapView.jsx    # Google Maps integration
│   │   ├── Alerts/
│   │   │   └── Alerts.jsx     # Alert notifications
│   │   ├── Common/
│   │   │   ├── SearchBar.jsx  # Search input
│   │   │   ├── FilterBar.jsx  # Filter buttons
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── StatusBadge.jsx
│   │   └── Theme/
│   │       └── ThemeToggle.jsx # Dark mode toggle
│   ├── data/
│   │   └── mockData.js        # Mock bin data
│   ├── hooks/
│   │   └── useBins.js         # Custom hook for bin management
│   ├── pages/
│   │   ├── DashboardPage.jsx  # Dashboard page
│   │   ├── MapPage.jsx        # Map page
│   │   └── AlertsPage.jsx     # Alerts page
│   ├── utils/
│   │   └── helpers.js         # Utility functions
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── .env                        # Environment variables
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── vercel.json                 # Vercel deployment configuration
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── deploy.ps1                  # Windows deployment script
├── deploy.sh                   # Linux/Mac deployment script
├── VERCEL_DEPLOYMENT.md        # Detailed Vercel deployment guide
└── README.md
```

## Usage

### Dashboard Page
- View all bins in a responsive grid layout
- See real-time fill levels with color-coded progress bars
- Filter bins by status using the filter buttons
- Search for specific bins by ID or location

### Map Page
- View all bin locations on an interactive Google Map
- Click on markers to see detailed bin information
- Color-coded markers indicate bin status:
  - Green: Normal (< 70%)
  - Yellow: Warning (70-89%)
  - Red: Full (≥ 90%)

### Alerts Page
- View all bins that are full and require immediate attention
- Dismiss individual alerts
- Clear all alerts at once
- See location and fill level for each alert

## Customization

### Adding More Bins
Edit `src/data/mockData.js` to add or modify bin data:

```javascript
{
  id: "BIN013",
  fillLevel: 55,
  status: "Normal",
  latitude: 12.95,
  longitude: 77.65,
  location: "New Location, Bangalore"
}
```

### Status Thresholds
Modify the status calculation in `src/utils/helpers.js`:

```javascript
export const getStatusFromFillLevel = (fillLevel) => {
  if (fillLevel >= 90) return 'Full';      // Change threshold
  if (fillLevel >= 70) return 'Warning';   // Change threshold
  return 'Normal';
};
```

### API Integration
The code is structured for easy API integration. Replace the mock data in `src/hooks/useBins.js`:

```javascript
useEffect(() => {
  const fetchBins = async () => {
    try {
      const response = await fetch('YOUR_API_ENDPOINT');
      const data = await response.json();
      setBins(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bins:', error);
      setLoading(false);
    }
  };
  
  fetchBins();
}, []);
```

## Build for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

## Preview Production Build

```bash
npm run preview
```

## 🚀 Deploy to Vercel

### Quick Deploy (Windows):
```powershell
.\deploy.ps1
```

### Quick Deploy (Linux/Mac):
```bash
./deploy.sh
```

### Manual Deploy:
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

📖 **For detailed deployment instructions, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)**

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use this project for learning and development.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For support, please open an issue in the repository or contact the development team.
