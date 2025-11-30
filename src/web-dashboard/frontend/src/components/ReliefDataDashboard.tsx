import { useState, useEffect } from 'react';
import {
  externalDataService,
  ReliefCamp,
  EmergencyRequest,
  Contribution,
} from '../services/externalDataService';
import toast from 'react-hot-toast';
import MainLayout from './MainLayout';

type TabType = 'camps' | 'requests' | 'contributions';

export default function ReliefDataDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('camps');
  const [camps, setCamps] = useState<ReliefCamp[]>([]);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: 6.9271, lng: 79.8612 }); // Colombo default
  const [radius, setRadius] = useState(50);
  const [campType, setCampType] = useState<'emergency' | 'temporary' | 'permanent'>('emergency');

  useEffect(() => {
    fetchData();
  }, [activeTab, radius, campType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'camps':
          const campsResponse = await externalDataService.getReliefCamps(campType, {
            lat: location.lat,
            lng: location.lng,
            radius,
          });
          setCamps(campsResponse.data || []);
          break;
        case 'requests':
          const requestsResponse = await externalDataService.getEmergencyRequests({
            lat: location.lat,
            lng: location.lng,
            radius,
          });
          setRequests(requestsResponse.data || []);
          break;
        case 'contributions':
          const contributionsResponse = await externalDataService.getNearbyContributions({
            lat: location.lat,
            lng: location.lng,
            radius,
          });
          setContributions(contributionsResponse.data || []);
          break;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch relief data');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-green-500 text-white',
    };
    return colors[urgency] || 'bg-gray-500 text-white';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header - Mobile Responsive */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Relief Operations Dashboard</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
              Access public relief data, camps, and volunteer contributions
            </p>
          </div>

        {/* Location & Radius Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude (Center)
              </label>
              <input
                type="number"
                value={location.lat}
                onChange={(e) => setLocation({ ...location, lat: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude (Center)
              </label>
              <input
                type="number"
                value={location.lng}
                onChange={(e) => setLocation({ ...location, lng: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius (km)
              </label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="500"
              />
            </div>
          </div>
          <button
            onClick={fetchData}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('camps')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'camps'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Relief Camps
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Emergency Requests
              </button>
              <button
                onClick={() => setActiveTab('contributions')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'contributions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Volunteer Contributions
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading data...</p>
              </div>
            ) : (
              <>
                {/* Relief Camps Tab */}
                {activeTab === 'camps' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Camp Type
                      </label>
                      <select
                        value={campType}
                        onChange={(e) =>
                          setCampType(e.target.value as 'emergency' | 'temporary' | 'permanent')
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="emergency">Emergency</option>
                        <option value="temporary">Temporary</option>
                        <option value="permanent">Permanent</option>
                      </select>
                    </div>
                    {camps.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No relief camps found</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {camps.map((camp) => (
                          <div key={camp.id} className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">{camp.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{camp.location.address}</p>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">
                                Type: <span className="font-medium">{camp.type}</span>
                              </span>
                              {camp.capacity && (
                                <span className="text-gray-500">
                                  Capacity: {camp.current_occupancy || 0}/{camp.capacity}
                                </span>
                              )}
                            </div>
                            {camp.contact_phone && (
                              <p className="text-sm text-blue-600 mt-2">📞 {camp.contact_phone}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Emergency Requests Tab */}
                {activeTab === 'requests' && (
                  <>
                    {requests.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No emergency requests found</p>
                    ) : (
                      <div className="space-y-4">
                        {requests.map((request) => (
                          <div
                            key={request.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-gray-900">{request.type}</h3>
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyBadge(
                                  request.urgency
                                )}`}
                              >
                                {request.urgency}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                            <div className="flex justify-between items-center text-sm">
                              <div>
                                <p className="text-gray-500">{request.location.address}</p>
                                <p className="text-gray-500">
                                  Contact: {request.requester_name} - {request.requester_phone}
                                </p>
                              </div>
                              <span className="text-gray-400">{formatDate(request.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Volunteer Contributions Tab */}
                {activeTab === 'contributions' && (
                  <>
                    {contributions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No volunteer contributions found
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contributions.map((contribution) => (
                          <div
                            key={contribution.id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {contribution.type}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">{contribution.description}</p>
                            {contribution.quantity && (
                              <p className="text-sm font-medium text-blue-600 mb-2">
                                Quantity: {contribution.quantity} {contribution.unit}
                              </p>
                            )}
                            <div className="text-sm text-gray-500">
                              <p>By: {contribution.contributor_name}</p>
                              <p>{contribution.location.address}</p>
                              <p className="text-gray-400">{formatDate(contribution.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReliefDataDashboard;
