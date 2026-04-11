import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, AlertTriangle, Leaf } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/map', icon: Map, label: 'Map View' },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts' }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white border-r border-primary-100 shadow-soft h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary-100">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2.5 rounded-xl shadow-lg">
            <Leaf size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-800">EcoTrack</h1>
            <p className="text-xs text-primary-600">Smart Waste Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-3 px-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary-100">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4">
          <p className="text-sm font-medium text-primary-800 mb-1">Eco Status</p>
          <p className="text-xs text-primary-600">System running smoothly</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-primary-700 font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
