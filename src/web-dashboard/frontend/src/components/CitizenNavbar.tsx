import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Phone, AlertTriangle, Package, Map, MessageSquare, Users, Navigation } from 'lucide-react';

const CitizenNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/citizen', label: 'Home', icon: Map },
    { path: '/citizen/emergency-contacts', label: 'Emergency Contacts', icon: Phone },
    { path: '/citizen/route-watch', label: 'RouteWatch', icon: Navigation },
    { path: '/citizen/sos', label: 'SOS', icon: AlertTriangle },
    { path: '/citizen/report', label: 'Report', icon: AlertTriangle },
    { path: '/citizen/relief-tracker', label: 'Relief', icon: Package },
    { path: '/citizen/map', label: 'Map', icon: Map },
    { path: '/citizen/chat', label: 'AI Assistant', icon: MessageSquare },
    { path: '/citizen/volunteer', label: 'Volunteer', icon: Users },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
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
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">ResQ Hub</h1>
              <p className="text-blue-100 text-xs">Sri Lanka Emergency Response</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
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

          {/* Admin Login Button (Desktop) */}
          <button
            onClick={() => navigate('/login')}
            className="hidden md:block bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Admin Login
          </button>

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
          <div className="lg:hidden pb-4 border-t border-blue-500">
            <div className="flex flex-col space-y-2 mt-4">
              {navItems.map((item) => {
                const Icon = item.icon;
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
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="bg-white text-blue-600 px-4 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
              >
                Admin/Responder Login
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default CitizenNavbar;
