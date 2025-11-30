import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Navigation, ArrowLeft, AlertTriangle, MapPin, Clock, TrendingUp } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface SafeRoute {
  _id: string;
  route_id: string;
  route_name: string;
  route_type: string;
  start_location: {
    name: string;
    coordinates: [number, number];
  };
  end_location: {
    name: string;
    coordinates: [number, number];
  };
  distance_km: number;
  typical_travel_time_minutes: number;
  current_travel_time_minutes: number;
  status: string;
  severity: string;
  traffic_density: string;
  risk_level: string;
  alternative_routes_available: boolean;
}

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const AVOID_CONDITIONS = [
  { value: 'blocked', label: 'Blocked Roads' },
  { value: 'flooded', label: 'Flooded Areas' },
  { value: 'landslide', label: 'Landslide Zones' },
  { value: 'hazardous', label: 'Hazardous Conditions' },
  { value: 'damaged', label: 'Damaged Roads' }
];

const SafeRoutesPage: React.FC = () => {
  const navigate = useNavigate();
  const [fromDistrict, setFromDistrict] = useState('');
  const [toDistrict, setToDistrict] = useState('');
  const [avoidConditions, setAvoidConditions] = useState<string[]>(['blocked', 'flooded']);
  const [safeRoutes, setSafeRoutes] = useState<SafeRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const toggleCondition = (condition: string) => {
    if (avoidConditions.includes(condition)) {
      setAvoidConditions(avoidConditions.filter(c => c !== condition));
    } else {
      setAvoidConditions([...avoidConditions, condition]);
    }
  };

  const handleSearch = async () => {
    if (!fromDistrict || !toDistrict) {
      toast.error('Please select both origin and destination districts');
      return;
    }

    if (fromDistrict === toDistrict) {
      toast.error('Origin and destination must be different');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        from_district: fromDistrict,
        to_district: toDistrict,
        avoid_conditions: avoidConditions.join(',')
      });

      const response = await axios.get(`${API_BASE_URL}/api/public/safe-routes?${params}`);
      setSafeRoutes(response.data.routes || []);
      setSearched(true);
      
      if (response.data.routes?.length === 0) {
        toast.error('No safe routes found with current filters');
      } else {
        toast.success(`Found ${response.data.routes?.length || 0} safe route(s)`);
      }
    } catch (error) {
      console.error('Error fetching safe routes:', error);
      toast.error('Failed to fetch safe routes');
      setSafeRoutes([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'partially_blocked': return 'bg-yellow-100 text-yellow-800';
      case 'hazardous': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'extreme': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDelayPercentage = (route: SafeRoute) => {
    if (!route.typical_travel_time_minutes || !route.current_travel_time_minutes) return 0;
    return ((route.current_travel_time_minutes - route.typical_travel_time_minutes) / route.typical_travel_time_minutes * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/citizen/route-watch')}
            className="flex items-center text-white hover:text-green-100 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to RouteWatch
          </button>
          <div className="flex items-center">
            <Navigation className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-3xl font-bold">Find Safe Routes</h1>
              <p className="text-green-100 mt-1">Get route recommendations avoiding affected areas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Your Route</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                From District
              </label>
              <select
                value={fromDistrict}
                onChange={(e) => setFromDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select origin district</option>
                {SRI_LANKA_DISTRICTS.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                To District
              </label>
              <select
                value={toDistrict}
                onChange={(e) => setToDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select destination district</option>
                {SRI_LANKA_DISTRICTS.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avoid Conditions (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVOID_CONDITIONS.map(condition => (
                <button
                  key={condition.value}
                  onClick={() => toggleCondition(condition.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    avoidConditions.includes(condition.value)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {condition.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !fromDistrict || !toDistrict}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Searching...' : 'Find Safe Routes'}
          </button>
        </div>

        {/* Results */}
        {searched && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {safeRoutes.length > 0 ? 'Recommended Routes' : 'No Routes Found'}
            </h2>

            {safeRoutes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Safe Routes Available</h3>
                <p className="text-gray-600">
                  We couldn't find any safe routes between these districts with your current filters.
                  Try adjusting your avoid conditions or check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {safeRoutes.map((route, index) => {
                  const delay = getDelayPercentage(route);
                  return (
                    <div key={route._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start">
                          <div className="bg-green-100 text-green-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{route.route_name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {route.start_location.name} → {route.end_location.name}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(route.status)}`}>
                          {route.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Distance</p>
                            <p className="font-semibold">{route.distance_km} km</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Travel Time</p>
                            <p className="font-semibold">
                              {Math.floor((route.current_travel_time_minutes || route.typical_travel_time_minutes) / 60)}h{' '}
                              {(route.current_travel_time_minutes || route.typical_travel_time_minutes) % 60}m
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Traffic</p>
                            <p className="font-semibold capitalize">{route.traffic_density}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Risk Level</p>
                            <p className={`font-semibold capitalize ${getRiskColor(route.risk_level)}`}>
                              {route.risk_level}
                            </p>
                          </div>
                        </div>
                      </div>

                      {delay > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Current delay: {delay.toFixed(0)}% longer than usual
                            ({Math.floor((route.current_travel_time_minutes - route.typical_travel_time_minutes) / 60)}h{' '}
                            {(route.current_travel_time_minutes - route.typical_travel_time_minutes) % 60}m extra)
                          </p>
                        </div>
                      )}

                      {route.alternative_routes_available && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            ℹ️ Alternative routes available for this path
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SafeRoutesPage;
