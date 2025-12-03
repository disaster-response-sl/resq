import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, AlertCircle, Search, Map as MapIcon, ArrowLeft, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import axios from 'axios';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different urgency levels
const createCustomIcon = (urgency: string) => {
  const colors: Record<string, string> = {
    emergency: '#dc2626',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#22c55e',
  };
  
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${colors[urgency] || '#3b82f6'}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface ReliefCamp {
  id: string;
  full_name: string;
  address: string;
  latitude: number;
  longitude: number;
  establishment_type: string;
  num_men?: number;
  num_women?: number;
  num_children?: number;
  urgency: string;
  status: string;
  assistance_types: string[];
  distance_km?: number;
}

const ReliefTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reliefCamps, setReliefCamps] = useState<ReliefCamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRadius, setSearchRadius] = useState('50');
  const [debouncedRadius, setDebouncedRadius] = useState('50');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Debounce search radius to prevent notification spam while adjusting slider
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRadius(searchRadius);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchRadius]);

  useEffect(() => {
    if (userLocation) {
      fetchReliefCamps();
    }
  }, [userLocation, debouncedRadius]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          setUserLocation({ lat: 6.9271, lng: 79.8612 }); // Default to Colombo
          toast.error('Using default location (Colombo). Enable GPS for accurate results.');
        }
      );
    } else {
      setUserLocation({ lat: 6.9271, lng: 79.8612 });
      toast.error('Geolocation not supported');
    }
  };

  const fetchReliefCamps = async () => {
    if (!userLocation) return;

    try {
      setLoading(true);
      
      // HYBRID DATA MODEL: Fetch Supabase (requests + contributions) AND MongoDB help requests
      const baseParams = new URLSearchParams();
      baseParams.append('limit', '500');
      baseParams.append('lat', userLocation.lat.toString());
      baseParams.append('lng', userLocation.lng.toString());
      baseParams.append('radius_km', debouncedRadius);
      baseParams.append('sort', 'distance');

      // Fetch data from Sri Lanka Flood Relief Public Data API
      const apiUrl = import.meta.env.VITE_PUBLIC_DATA_API_URL || 'https://api.floodsupport.org/default/sri-lanka-flood-relief-jm/v1.0';
      const apiKey = import.meta.env.VITE_PUBLIC_DATA_API_KEY;

      const apiHeaders = apiKey ? { 'api-key': apiKey } : {};

      // Fetch REQUESTS from public API
      const requestParams = new URLSearchParams(baseParams);
      requestParams.append('type', 'requests');
      const requestsResponse = await axios.get(
        `${apiUrl}/public-data-api?${requestParams.toString()}`,
        { headers: apiHeaders }
      ).catch((err) => {
        console.error('❌ Public Data API requests error:', err.message);
        return { data: { requests: [], meta: {} } };
      });

      // Fetch CONTRIBUTIONS from public API
      const contributionParams = new URLSearchParams(baseParams);
      contributionParams.append('type', 'contributions');
      const contributionsResponse = await axios.get(
        `${apiUrl}/public-data-api?${contributionParams.toString()}`,
        { headers: apiHeaders }
      ).catch((err) => {
        console.error('❌ Public Data API contributions error:', err.message);
        return { data: { contributions: [], meta: {} } };
      });

      // Fetch MongoDB help requests - all pending reports (food, shelter, medical, danger)
      const mongoResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/user-reports?status=pending&limit=100`
      ).catch(() => ({ data: { success: false, data: [] } }));

      // Public Data API response: { requests: [...], contributions: [...], meta: {...} }
      console.log('🔍 Raw API responses:', {
        requestsResponse: requestsResponse.data,
        contributionsResponse: contributionsResponse.data,
        mongoResponse: mongoResponse.data
      });

      const publicRequests = requestsResponse.data.requests || [];
      const publicContributions = contributionsResponse.data.contributions || [];
      const mongoHelp = mongoResponse.data.success ? mongoResponse.data.data : [];

      console.log('📊 Data fetched:', {
        publicRequests: publicRequests.length,
        publicContributions: publicContributions.length,
        mongoHelp: mongoHelp.length,
        requestsMeta: requestsResponse.data.meta,
        contributionsMeta: contributionsResponse.data.meta
      });

      // Map public contributions (people offering help)
      const contributionsCamps = publicContributions.map((contrib: any) => ({
        id: contrib.id,
        full_name: `💚 ${contrib.full_name} (Volunteer)`,
        address: contrib.address,
        latitude: contrib.latitude,
        longitude: contrib.longitude,
        establishment_type: 'Volunteer Contribution',
        urgency: 'low',
        status: contrib.status || 'available',
        assistance_types: [...(contrib.goods_types || []), ...(contrib.services_types || []), ...(contrib.labor_types || [])],
        distance_km: contrib.distance_km,
        source: 'public_api_contribution'
      }));

      // Map MongoDB help requests to relief camp format
      const mongoHelpAsCamps = mongoHelp.map((help: any) => {
        const typeLabels: any = {
          food: 'Food Shortage 🍽️',
          shelter: 'Shelter Needed 🏠',
          medical: 'Medical Emergency 🏥',
          danger: 'Danger Alert ⚠️'
        };
        
        return {
          id: help._id,
          full_name: typeLabels[help.type] || 'Help Request',
          address: help.description || 'No description',
          latitude: help.location.lat,
          longitude: help.location.lng,
          establishment_type: typeLabels[help.type] || 'Help Needed',
          urgency: help.type === 'medical' ? 'emergency' : 'high',
          status: help.status,
          assistance_types: [help.type],
          source: 'mongodb'
        };
      });

      // Merge ALL sources
      const mergedCamps = [
        ...publicRequests,
        ...contributionsCamps,
        ...mongoHelpAsCamps
      ];

      console.log(`✅ HYBRID Relief: ${publicRequests.length} Public API requests + ${contributionsCamps.length} contributions + ${mongoHelpAsCamps.length} MongoDB help = ${mergedCamps.length} total`);

      setReliefCamps(mergedCamps);
      toast.success(`Found ${mergedCamps.length} relief locations within ${debouncedRadius}km`);
    } catch (error) {
      console.error('Relief camps fetch error:', error);
      toast.error('Failed to fetch relief camps');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/citizen')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Relief Demand & Supply Tracker</h1>
                <p className="text-blue-100 text-sm">Real-time coordination platform</p>
              </div>
            </div>
            <img 
              src="/favicon.png" 
              alt="ResQ Hub Logo" 
              className="h-10 w-10"
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Get Help or Volunteer
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Real-time coordination platform connecting affected residents with volunteers and 
                authorities during flood emergencies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/citizen/report')}
                className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                <AlertCircle className="h-8 w-8" />
                <div className="text-left">
                  <div className="text-xl font-bold">Ask for Support</div>
                  <div className="text-sm text-red-100">Request immediate assistance</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/citizen/volunteer')}
                className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                <Heart className="h-8 w-8" />
                <div className="text-left">
                  <div className="text-xl font-bold">Offer Support</div>
                  <div className="text-sm text-green-100">Volunteer or donate resources</div>
                </div>
              </button>
            </div>
          </div>

          {/* Find Nearby Help Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Search className="h-7 w-7 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Find Nearby Help</h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius (km)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(e.target.value)}
                  className="flex-1"
                />
                <span className="text-lg font-semibold text-gray-900 w-16">{searchRadius} km</span>
              </div>
            </div>

            {userLocation && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Your Location:</strong> {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
                <button
                  onClick={getCurrentLocation}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  📍 Update Location
                </button>
              </div>
            )}

            <button
              onClick={fetchReliefCamps}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : '🔍 Find Nearby Shelters'}
            </button>
          </div>

          {/* Live Relief Camps Map */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Live Relief Camps Map</h2>
                  <p className="text-gray-600">
                    Showing {reliefCamps.length} active relief camps • Updated in real-time
                  </p>
                </div>
                <button
                  onClick={() => navigate('/citizen/map')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  <MapIcon className="h-5 w-5" />
                  <span>View Full Map</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              {loading ? (
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading relief camps...</p>
                </div>
              ) : reliefCamps.length > 0 && userLocation ? (
                <div className="mb-6">
                  <MapContainer
                    center={[userLocation.lat, userLocation.lng]}
                    zoom={10}
                    style={{ height: '500px', width: '100%', borderRadius: '0.5rem' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* User location marker */}
                    {userLocation && (
                      <Marker position={[userLocation.lat, userLocation.lng]}>
                        <Popup>
                          <div className="text-center">
                            <strong>📍 Your Location</strong>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Search radius circle */}
                    {userLocation && (
                      <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={parseFloat(debouncedRadius) * 1000}
                        pathOptions={{
                          color: '#3b82f6',
                          fillColor: '#3b82f6',
                          fillOpacity: 0.1,
                        }}
                      />
                    )}

                    {/* Relief camp markers */}
                    {reliefCamps.map((camp) => (
                      <Marker
                        key={camp.id}
                        position={[camp.latitude, camp.longitude]}
                        icon={createCustomIcon(camp.urgency)}
                      >
                        <Popup>
                          <div className="min-w-[250px]">
                            <h3 className="font-bold text-gray-900 mb-2">{camp.full_name}</h3>
                            <p className="text-sm text-gray-700 mb-2">{camp.address}</p>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>📍 {camp.distance_km?.toFixed(1) || '0.0'} km away</div>
                              <div>🏢 {camp.establishment_type}</div>
                              <div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  camp.urgency === 'emergency' ? 'bg-red-500 text-white' :
                                  camp.urgency === 'high' ? 'bg-orange-500 text-white' :
                                  camp.urgency === 'medium' ? 'bg-blue-500 text-white' :
                                  'bg-green-500 text-white'
                                }`}>
                                  {camp.urgency.toUpperCase()}
                                </span>
                              </div>
                              {(camp.num_men || camp.num_women || camp.num_children) && (
                                <div className="flex items-center space-x-2 mt-2">
                                  {camp.num_men && <span>👨 {camp.num_men}</span>}
                                  {camp.num_women && <span>👩 {camp.num_women}</span>}
                                  {camp.num_children && <span>👶 {camp.num_children}</span>}
                                </div>
                              )}
                              {camp.assistance_types && camp.assistance_types.length > 0 && (
                                <div className="mt-2">
                                  <strong>Needs:</strong> {camp.assistance_types.slice(0, 3).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              ) : null}

              {loading ? null : (
                <div className="space-y-4">
                  {reliefCamps.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No relief camps found within {searchRadius}km</p>
                      <p className="text-sm text-gray-500 mt-2">Try increasing the search radius</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                      {reliefCamps.slice(0, 20).map((camp) => (
                        <div
                          key={camp.id}
                          className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${getUrgencyColor(camp.urgency)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-gray-900">{camp.full_name}</h3>
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${
                                camp.urgency === 'emergency'
                                  ? 'bg-red-500 text-white'
                                  : camp.urgency === 'high'
                                  ? 'bg-orange-500 text-white'
                                  : camp.urgency === 'medium'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-green-500 text-white'
                              }`}
                            >
                              {camp.urgency.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{camp.address}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                            <span>📍 {camp.distance_km?.toFixed(1) || '0.0'} km away</span>
                            <span>🏢 {camp.establishment_type}</span>
                          </div>
                          {(camp.num_men || camp.num_women || camp.num_children) && (
                            <div className="flex items-center space-x-3 text-xs text-gray-600 mb-2">
                              {camp.num_men && <span>👨 {camp.num_men} men</span>}
                              {camp.num_women && <span>👩 {camp.num_women} women</span>}
                              {camp.num_children && <span>👶 {camp.num_children} children</span>}
                            </div>
                          )}
                          {camp.assistance_types && camp.assistance_types.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {camp.assistance_types.slice(0, 3).map((type, idx) => (
                                <span
                                  key={idx}
                                  className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-700"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl shadow-lg p-8 text-white mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">1</div>
                <h3 className="font-bold text-lg mb-2">Request Help</h3>
                <p className="text-blue-100 text-sm">
                  Affected residents submit help requests with their location and needs through a simple form.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">2</div>
                <h3 className="font-bold text-lg mb-2">Real-Time Map</h3>
                <p className="text-blue-100 text-sm">
                  All requests appear instantly on an interactive map with color-coded urgency levels.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">3</div>
                <h3 className="font-bold text-lg mb-2">Coordinate Response</h3>
                <p className="text-blue-100 text-sm">
                  Volunteers and rescue teams view details, contact victims, and mark requests as resolved.
                </p>
              </div>
            </div>
          </div>

          {/* Map Legend */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-4">Map Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">Emergency</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-700">High</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-700">Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Low</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-700">Offers to Help</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-800 mb-2">Important Disclaimer</h3>
                <p className="text-yellow-800 text-sm">
                  It is the sole responsibility of donors and volunteers to verify the authenticity of help 
                  requests before providing assistance. This platform serves only as a coordination tool and 
                  assumes no responsibility for any damages, losses, or outcomes arising from interactions 
                  facilitated through this service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReliefTrackerPage;
