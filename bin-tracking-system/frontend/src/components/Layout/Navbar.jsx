import { useState } from 'react';
import { UserCog, Menu, X, LogOut } from 'lucide-react';
import { clearToken, goToLogin } from '../../auth/adminAuth';

const Navbar = ({ title = 'Dashboard' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    clearToken();
    goToLogin();
  };

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

          {/* Right: Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-heading">Admin User</p>
                <p className="text-xs text-gray-600">System Administrator</p>
              </div>
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-blue-400">
                <UserCog size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-800"
                title="Logout"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
