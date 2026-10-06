import { UserCog, Menu, X, LogOut } from 'lucide-react';
import { clearToken, goToLogin } from '../../auth/adminAuth';

const Navbar = ({
  title = 'Dashboard',
  onToggleMobileMenu = () => {},
  isMobileMenuOpen = false
}) => {
  const handleLogout = () => {
    clearToken();
    goToLogin();
  };

  return (
    <header className="navbar sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Hamburger & Page Title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2.5 -ml-1 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-primary-800 tracking-tight truncate">
                {title}
              </h2>
              <p className="hidden sm:block text-xs sm:text-sm text-primary-600 truncate">
                Monitor and manage smart waste telemetry
              </p>
            </div>
          </div>

          {/* Right: Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-200">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-heading leading-tight">Admin User</p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
              
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md border-2 border-blue-400 flex-shrink-0"
                title="Admin User (System Administrator)"
              >
                <UserCog size={20} className="text-white" strokeWidth={2.2} />
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors text-xs sm:text-sm font-semibold text-gray-700 min-h-[40px] sm:min-h-[42px]"
                title="Logout from EcoTrack"
              >
                <LogOut size={16} className="text-gray-600" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
