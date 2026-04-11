import { useState } from 'react';
import { Search, Bell, User, Menu, X } from 'lucide-react';

const Navbar = ({ title = 'Dashboard', searchTerm = '', onSearchChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="navbar sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Title & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-primary-50 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h2 className="text-2xl font-bold text-primary-800">{title}</h2>
              <p className="text-sm text-primary-600">Monitor and manage waste bins</p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400" size={18} />
              <input
                type="text"
                placeholder="Search bins by ID or location..."
                value={searchTerm}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="input-field w-full pl-10 pr-4"
              />
            </div>
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-primary-50 rounded-lg transition-colors">
              <Bell size={20} className="text-primary-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-3 border-l border-primary-200">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-primary-800">Admin User</p>
                <p className="text-xs text-primary-600">System Administrator</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                <User size={20} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400" size={18} />
              <input
                type="text"
                placeholder="Search bins..."
                value={searchTerm}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="input-field w-full pl-10 pr-4"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
