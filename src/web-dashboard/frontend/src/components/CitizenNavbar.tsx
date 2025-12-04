import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Phone, AlertTriangle, Package, Map, MessageSquare, Users, Navigation, LogIn, LogOut, UserCircle, Search, BarChart3 } from 'lucide-react';
import { citizenAuthService, CitizenUser } from '../services/citizenAuthService';
import toast from 'react-hot-toast';

const CitizenNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<CitizenUser | null>(null);

  const navItems = [
    { path: '/citizen', label: 'Home', icon: Map },
    { path: '/citizen/emergency-contacts', label: 'Emergency Contacts', icon: Phone },
    { path: '/citizen/route-watch', label: 'RouteWatch', icon: Navigation },
    { path: '/citizen/sos', label: 'SOS', icon: AlertTriangle },
    { path: '/citizen/report', label: 'Report', icon: AlertTriangle },
    { path: '/citizen/relief-tracker', label: 'Relief', icon: Package },
    { path: '/missing-persons/search', label: 'Missing Person', icon: Search },
    { path: '/citizen/map', label: 'Map', icon: Map },
    { path: '/citizen/chat', label: 'AI Assistant', icon: MessageSquare },
    { path: '/citizen/volunteer', label: 'Volunteer', icon: Users },
    { path: 'https://flood-support-analytics.vercel.app/', label: 'Analytics', icon: BarChart3, external: true },
  ];

  useEffect(() => {
    // Check if user is logged in
    const currentUser = citizenAuthService.getUser();
    setUser(currentUser);
  }, [location.pathname]); // Re-check on route change

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    citizenAuthService.logout();
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/citizen');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/citizen')}
          >
            <img 
              src="/favicon.png" 
              alt="ResQ Hub Logo" 
              className="h-8 w-8"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">ResQ Hub</h1>
              <p className="text-blue-100 text-[10px] sm:text-xs">Sri Lanka Emergency Response</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              if ((item as any).external) {
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-blue-100 hover:bg-blue-700 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                );
              }
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-blue-100 mr-2">
                  <UserCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/citizen/login')}
                  className="flex items-center space-x-1 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => navigate('/citizen/signup')}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-blue-500 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="flex flex-col space-y-2 mt-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                if ((item as any).external) {
                  return (
                    <a
                      key={item.path}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors text-blue-100 hover:bg-blue-700 hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </a>
                  );
                }
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              
              {/* Mobile Auth Buttons */}
              {user ? (
                <>
                  <div className="flex items-center space-x-2 px-4 py-3 bg-blue-800 rounded-lg text-white">
                    <UserCircle className="h-5 w-5" />
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center space-x-2 bg-white text-blue-600 px-4 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate('/citizen/login');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center space-x-2 bg-white/10 text-white px-4 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/citizen/signup');
                      setMobileMenuOpen(false);
                    }}
                    className="bg-white text-blue-600 px-4 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default CitizenNavbar;
