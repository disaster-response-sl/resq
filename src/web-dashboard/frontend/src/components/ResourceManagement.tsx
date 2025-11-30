import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { canAccessResourceManagement } from '../utils/permissions';
import { Package, BarChart3, List, Truck, AlertCircle } from 'lucide-react';
import ResourceOverview from './resources/ResourceOverview';
import ResourceInventory from './resources/ResourceInventory';
import ResourceList from './resources/ResourceList';
import AllocationTracking from './resources/AllocationTracking';
import MainLayout from './MainLayout';

type TabType = 'overview' | 'inventory' | 'list' | 'tracking';

const ResourceManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Check if user has permission to access resource management
  if (!canAccessResourceManagement(user)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32 text-gray-500">
          <AlertCircle className="w-8 h-8 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
            <p className="text-sm">Resource management is only available to administrators and responders.</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'inventory' as TabType, label: 'Inventory', icon: Package },
    { id: 'list' as TabType, label: 'Resources', icon: List },
    { id: 'tracking' as TabType, label: 'Deployments', icon: Truck }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ResourceOverview />;
      case 'inventory':
        return <ResourceInventory />;
      case 'list':
        return <ResourceList />;
      case 'tracking':
        return <AllocationTracking />;
      default:
        return <ResourceOverview />;
    }
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
      {/* Tabs - Mobile Responsive */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-2 sm:gap-4 md:gap-8 px-2 sm:px-4 md:px-6 pt-2 sm:pt-3 md:pt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 sm:py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 sm:gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content - Mobile Responsive */}
      <div className="p-2 sm:p-4 md:p-6">
        {renderTabContent()}
      </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ResourceManagement;
