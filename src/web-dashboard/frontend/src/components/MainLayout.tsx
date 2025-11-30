import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Shield, Users, AlertTriangle, Activity, MapPin, Home, Map, Package, Settings as SettingsIcon, Layers, BarChart3, DollarSign } from 'lucide-react';
import NotificationBell from './NotificationBell';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { hasPermission, canRead, isAdmin } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border border-red-200';
      case 'responder': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'citizen': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'responder': return <Activity className="w-4 h-4" />;
      case 'citizen': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="ResQ Hub Logo"
                  className="w-12 h-12 rounded-lg"
                />
              </div>
              <div className="text-gray-900">
                <h1 className="text-2xl font-bold tracking-tight">
                  ResQ Hub
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  National Disaster Management Platform
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationBell />
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name || user?.individualId}
                  </div>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role || '')}`}>
                    {getRoleIcon(user?.role || '')}
                    {user?.role?.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <nav className="mt-8 px-4">
            <div className="space-y-2">
              <Link
                to="/dashboard"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Home className="w-5 h-5 mr-3" />
                Overview
              </Link>

              {/* Analytics - Admin only */}
              {hasPermission('analytics:full') && (
                <Link
                  to="/analytics"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/analytics'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  Analytics
                </Link>
              )}

              {/* Payment Management removed - focusing on disaster response features */}
              {/* {isAdmin() && (
                <Link to="/payments" className="..."><DollarSign className="w-5 h-5 mr-3" />Payment Management</Link>
              )} */}

              {/* SOS Monitor - Admin only */}
              {isAdmin() && canRead('sos') && (
                <Link
                  to="/sos"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/sos'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 mr-3" />
                  SOS Monitor
                </Link>
              )}

              {/* Disaster Management - Both admin and responder */}
              {canRead('disasters') && (
                <Link
                  to="/disasters"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/disasters'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <MapPin className="w-5 h-5 mr-3" />
                  Disaster Management
                </Link>
              )}

              {/* Maps - Both admin and responder */}
              {canRead('disasters') && (
                <Link
                  to="/map"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/map' || location.pathname === '/map/disaster' || location.pathname === '/map/sos'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Map className="w-5 h-5 mr-3" />
                  Maps
                </Link>
              )}

              {location.pathname.startsWith('/map') && canRead('disasters') && (
                <div className="ml-6 space-y-1">
                  <Link
                    to="/map/disaster"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === '/map/disaster'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Disaster Heat Map
                  </Link>
                  {isAdmin() && (
                    <Link
                      to="/map/sos"
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        location.pathname === '/map/sos'
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      SOS Heat Map
                    </Link>
                  )}
                </div>
              )}

              {/* Resource Management - Both admin and responder */}
              {canRead('resources') && (
                <Link
                  to="/resources"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/resources'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Package className="w-5 h-5 mr-3" />
                  Resource Management
                </Link>
              )}

              {/* Missing Persons */}
              <Link
                to="/missing-persons"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/missing-persons'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5 mr-3" />
                Missing Persons
              </Link>

              {/* Relief Data */}
              <Link
                to="/relief-data"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/relief-data'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Package className="w-5 h-5 mr-3" />
                Relief Operations
              </Link>

              {/* Reports - Admin only */}
              {isAdmin() && (
                <Link
                  to="/reports"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/reports'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  Advanced Reports
                </Link>
              )}

              {/* NDX removed - mock DPI integration not needed for production */}
              {/* {isAdmin() && (
                <Link to="/ndx" className="..."><Layers className="w-5 h-5 mr-3" />NDX</Link>
              )} */}

              {/* Settings - Admin only */}
              {isAdmin() && (
                <Link
                  to="/settings"
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/settings'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <SettingsIcon className="w-5 h-5 mr-3" />
                  Settings
                </Link>
              )}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
