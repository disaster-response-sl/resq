import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, AlertTriangle, Navigation, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CitizenNavbar from './CitizenNavbar';

const ReportRoadIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState('');

  const [formData, setFormData] = useState({
    reporter_name: '',
    reporter_phone: '',
    reporter_email: '',
    location_name: '',
    district: '',
    city: '',
    road_name: '',
    condition: 'blocked',
    severity: 'medium',
    description: '',
    affected_lanes: 'all',
    traffic_status: 'completely_blocked',
    estimated_clearance_time: '',
    alternative_route: '',
    emergency_vehicles_accessible: false,
    casualties_reported: false,
    casualties_count: 0
  });

  const SRI_LANKA_DISTRICTS = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          
          // Reverse geocode to get location name
          try {
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = response.data;
            const name = data.display_name || 'Current Location';
            setLocationName(name);
            
            setFormData(prev => ({
              ...prev,
              location_name: data.address?.road || data.address?.neighbourhood || 'Current Location',
              city: data.address?.city || data.address?.town || '',
              district: data.address?.state_district || data.address?.county || ''
            }));
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            setLocationName('Current Location');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to get your location. Please enter manually.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      toast.error('Location is required. Please enable location services.');
      return;
    }

    if (!formData.reporter_name || !formData.reporter_phone || !formData.road_name || 
        !formData.district || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      const response = await axios.post(`${API_BASE_URL}/api/public/road-reports`, {
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude
      });

      if (response.data.success) {
        toast.success('Road report submitted successfully!');
        navigate('/citizen/route-watch');
      }
    } catch (error: any) {
      console.error('Error submitting road report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <CitizenNavbar />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Report Road Issue</h1>
              <p className="text-red-100 text-sm">Help keep our roads safe - Report hazards immediately</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate('/citizen/route-watch')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to LankaRouteWatch
        </button>

        {/* Current Location Display */}
        {location && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Navigation className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Current Location Detected</p>
                <p className="text-sm text-gray-600">{locationName}</p>
                <p className="text-xs text-gray-500">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {/* Reporter Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-blue-600" />
              Your Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="reporter_name"
                  value={formData.reporter_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="reporter_phone"
                  value={formData.reporter_phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+94 XX XXX XXXX"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="reporter_email"
                  value={formData.reporter_email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Location Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Road Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="road_name"
                  value={formData.road_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Galle Road, A1 Highway"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District <span className="text-red-600">*</span>
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select District</option>
                  {SRI_LANKA_DISTRICTS.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location/Landmark <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="location_name"
                  value={formData.location_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nearest landmark or area"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City/Town
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="City or town name"
                />
              </div>
            </div>
          </div>

          {/* Issue Details */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Issue Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blocked">Blocked</option>
                  <option value="damaged">Damaged Road</option>
                  <option value="flooded">Flooded</option>
                  <option value="landslide">Landslide</option>
                  <option value="accident">Accident</option>
                  <option value="hazardous">Hazardous Conditions</option>
                  <option value="debris">Debris on Road</option>
                  <option value="closed">Road Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level <span className="text-red-600">*</span>
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low - Minor inconvenience</option>
                  <option value="medium">Medium - Significant delay</option>
                  <option value="high">High - Major hazard</option>
                  <option value="critical">Critical - Immediate danger</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affected Lanes
                </label>
                <select
                  name="affected_lanes"
                  value={formData.affected_lanes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Lanes</option>
                  <option value="partial">Partial Lanes</option>
                  <option value="one_lane">One Lane</option>
                  <option value="shoulder">Shoulder Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Traffic Status
                </label>
                <select
                  name="traffic_status"
                  value={formData.traffic_status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="completely_blocked">Completely Blocked</option>
                  <option value="slow_moving">Slow Moving</option>
                  <option value="one_way">One Way Only</option>
                  <option value="detour_available">Detour Available</option>
                  <option value="normal">Normal Flow</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the road condition in detail..."
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Clearance Time
                </label>
                <input
                  type="text"
                  name="estimated_clearance_time"
                  value={formData.estimated_clearance_time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2 hours, 1 day, Unknown"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alternative Route (if known)
                </label>
                <input
                  type="text"
                  name="alternative_route"
                  value={formData.alternative_route}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Suggest an alternative route"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="emergency_vehicles_accessible"
                  checked={formData.emergency_vehicles_accessible}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Emergency vehicles can still access this route
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="casualties_reported"
                  checked={formData.casualties_reported}
                  onChange={handleChange}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Casualties or injuries reported
                </span>
              </label>

              {formData.casualties_reported && (
                <div className="ml-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Casualties
                  </label>
                  <input
                    type="number"
                    name="casualties_count"
                    value={formData.casualties_count}
                    onChange={handleChange}
                    min="0"
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/citizen/route-watch')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !location}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

        {/* Emergency Notice */}
        <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <strong>⚠️ Emergency Situations:</strong> If this is a life-threatening emergency or requires immediate attention, 
            please call <strong>117 (Emergency)</strong>, <strong>119 (Police)</strong>, or <strong>110 (Fire Brigade)</strong> immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportRoadIssuePage;
