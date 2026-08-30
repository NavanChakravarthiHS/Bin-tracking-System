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

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Router basename="/app.html">
      <div className="flex bg-gray-50 min-h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route element={<RequireAdmin />}>
                <Route path="/" element={<DashboardPage searchTerm={searchTerm} />} />
                <Route path="/map" element={<MapPage searchTerm={searchTerm} />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/bins" element={<BinsPage />} />
                <Route path="/collectors" element={<CollectorsPage />} />
                <Route path="/collections" element={<CollectionsPage />} />
              </Route>
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
