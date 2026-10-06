import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, AlertTriangle, Leaf, Users, Truck, Trash2, TrendingUp, X } from 'lucide-react';

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/map', icon: Map, label: 'Map View' },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
    { path: '/bins', icon: Trash2, label: 'Bins' },
    { path: '/collectors', icon: Users, label: 'Collectors' },
    { path: '/collections', icon: Truck, label: 'Collections' },
    { path: '/performance', icon: TrendingUp, label: 'Collector Performance' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close sidebar on Escape key press on mobile
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-gray-800 border-r border-gray-700 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out xl:static xl:w-64 xl:h-screen xl:sticky xl:top-0 xl:shadow-lg xl:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Logo & Mobile Close Header */}
        <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2.5 rounded-lg shadow-lg">
              <Leaf size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">EcoTrack</h1>
              <p className="text-xs text-gray-300 font-medium">Smart Waste System</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            className="xl:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700/60 rounded-lg transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1.5 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-3">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-700/80 rounded-lg p-3 border border-gray-600">
            <p className="text-xs font-semibold text-gray-200 mb-1">System Status</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
              <span className="text-xs text-gray-200 font-medium truncate">All systems operational</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
