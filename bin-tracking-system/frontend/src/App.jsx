import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import AlertsPage from './pages/AlertsPage';
import CollectorsPage from './pages/CollectorsPage';
import CollectionsPage from './pages/CollectionsPage';
import BinsPage from './pages/BinsPage';
import RequireAdmin from './components/Auth/RequireAdmin';
import PerformancePage from './pages/PerformancePage';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <Router basename="/app.html">
      <div className="flex bg-gray-50 min-h-screen relative overflow-x-hidden">
        {/* Sidebar (Responsive desktop sticky + mobile drawer) */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
          <Navbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onToggleMobileMenu={() => setMobileSidebarOpen((prev) => !prev)}
            isMobileMenuOpen={mobileSidebarOpen}
          />
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden">
            <div className="max-w-7xl mx-auto w-full">
              <Routes>
                <Route element={<RequireAdmin />}>
                  <Route path="/" element={<DashboardPage searchTerm={searchTerm} />} />
                  <Route path="/map" element={<MapPage searchTerm={searchTerm} />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/bins" element={<BinsPage />} />
                  <Route path="/collectors" element={<CollectorsPage />} />
                  <Route path="/collections" element={<CollectionsPage />} />
                  <Route path="/performance" element={<PerformancePage />} />
                </Route>
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
