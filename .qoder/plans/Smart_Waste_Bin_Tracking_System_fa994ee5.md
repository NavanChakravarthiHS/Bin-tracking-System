# Smart Waste Bin Tracking System

## Project Setup
- Initialize React app using Vite for fast development
- Install dependencies: React Router, Tailwind CSS, Google Maps React, Lucide React (icons)
- Set up project structure with organized folders

## Folder Structure
```
bin-tracking-system/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   └── BinCard.jsx
│   │   ├── Map/
│   │   │   └── MapView.jsx
│   │   ├── Alerts/
│   │   │   └── Alerts.jsx
│   │   ├── Common/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── StatusBadge.jsx
│   │   └── Theme/
│   │       └── ThemeToggle.jsx
│   ├── data/
│   │   └── mockData.js
│   ├── hooks/
│   │   └── useBins.js
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── MapPage.jsx
│   │   └── AlertsPage.jsx
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

## Implementation Steps

### 1. Project Initialization
- Create React app with Vite: `npm create vite@latest bin-tracking-system -- --template react`
- Install dependencies: `react-router-dom`, `@react-google-maps/api`, `lucide-react`, `tailwindcss`, `postcss`, `autoprefixer`
- Configure Tailwind CSS
- Set up routing with React Router

### 2. Mock Data Setup
Create `src/data/mockData.js` with 10-15 sample bins:
```javascript
export const mockBins = [
  { id: "BIN001", fillLevel: 30, status: "Normal", latitude: 12.9716, longitude: 77.5946 },
  { id: "BIN002", fillLevel: 85, status: "Full", latitude: 12.98, longitude: 77.60 },
  // ... more bins with varied statuses
];
```

### 3. Core Components

#### Layout Components
- **Navbar.jsx**: Top navigation with logo, nav links (Dashboard, Map, Alerts), and theme toggle
- **Sidebar.jsx**: Collapsible sidebar for mobile responsiveness

#### Dashboard Components
- **Dashboard.jsx**: Grid layout displaying all bins using BinCard components
- **BinCard.jsx**: Individual bin card with:
  - Bin ID display
  - Fill level percentage with progress bar
  - Status indicator (color-coded)
  - Hover effects and animations
  - Color coding: Green (Normal <70%), Yellow (Warning 70-89%), Red (Full >=90%)

#### Map Component
- **MapView.jsx**: Google Maps integration using `@react-google-maps/api`
  - Display bins as markers with color-coded icons
  - Info windows on marker click showing bin details
  - Responsive map container

#### Alerts Component
- **Alerts.jsx**: List of full bins with:
  - Red-styled alert cards
  - Alert messages ("Bin BIN001 is FULL")
  - Dismiss functionality
  - Empty state when no alerts

#### Common Components
- **SearchBar.jsx**: Input field to search bins by ID
- **FilterBar.jsx**: Filter buttons (All, Normal, Warning, Full)
- **LoadingSpinner.jsx**: Animated loading indicator
- **StatusBadge.jsx**: Reusable status badge component

### 4. Custom Hook
Create `src/hooks/useBins.js`:
- Manage bin state with useState
- Implement search and filter logic
- Simulate loading state with useEffect
- Return filtered bins, loading state, search/filter handlers

### 5. Page Components
- **DashboardPage.jsx**: Integrates Dashboard, SearchBar, FilterBar
- **MapPage.jsx**: Wraps MapView with search/filter capabilities
- **AlertsPage.jsx**: Shows filtered alerts with dismiss functionality

### 6. Styling & Features
- Implement dark mode toggle with CSS variables
- Add smooth animations using Tailwind transitions
- Create responsive grid layouts
- Add hover effects and micro-interactions
- Implement skeleton loading states

### 7. Routing Setup
Configure React Router in `App.jsx`:
- `/` → Dashboard
- `/map` → Map View
- `/alerts` → Alerts Page
- Add active state indicators in navigation

## Key Technical Details

### Status Logic
```javascript
const getStatus = (fillLevel) => {
  if (fillLevel >= 90) return "Full";
  if (fillLevel >= 70) return "Warning";
  return "Normal";
};
```

### Color Coding
- Normal: Green (`#10b981` / `bg-green-500`)
- Warning: Yellow (`#f59e0b` / `bg-yellow-500`)  
- Full: Red (`#ef4444` / `bg-red-500`)

### Google Maps Integration
- Use `@react-google-maps/api` package
- Require Google Maps API key (document setup process)
- Custom marker colors based on bin status
- InfoWindow with bin details on click

### Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Collapsible sidebar on mobile
- Responsive grid: 1 col (mobile) → 2 cols (tablet) → 3-4 cols (desktop)

### API-Ready Structure
- Separate data fetching logic in custom hook
- Easy to replace mock data with real API calls
- Consistent data structure for future backend integration

## File Creation Order
1. Project setup files (package.json, vite.config.js, tailwind.config.js)
2. Mock data and utility functions
3. Common components (SearchBar, FilterBar, LoadingSpinner, StatusBadge)
4. Layout components (Navbar, Sidebar)
5. Feature components (BinCard, Dashboard, MapView, Alerts)
6. Page components (DashboardPage, MapPage, AlertsPage)
7. App routing and main entry files
8. Styling and theme configuration