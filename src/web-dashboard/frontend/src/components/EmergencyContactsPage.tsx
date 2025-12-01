import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AlertTriangle, Shield, MapPin, Users, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CitizenNavbar from './CitizenNavbar';

interface DistrictContact {
  district: string;
  district_si: string;
  district_ta: string;
  officer_name: string;
  officer_title: string;
  office_phone: string;
  mobile_phone: string;
  email?: string;
  address?: string;
}

interface EmergencyStats {
  total_sos: number;
  total_missing: number;
  total_rescued: number;
  total_active_disasters: number;
  total_relief_camps: number;
}

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle'
];

const EMERGENCY_NUMBERS = [
  { number: '117', label: 'Emergency', color: 'bg-red-600', icon: '🚨' },
  { number: '119', label: 'Police', color: 'bg-blue-600', icon: '👮' },
  { number: '110', label: 'Fire Brigade', color: 'bg-orange-600', icon: '🚒' },
  { number: '108', label: 'Ambulance', color: 'bg-green-600', icon: '🚑' }
];

const EmergencyContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Gampaha');
  const [districtContact, setDistrictContact] = useState<DistrictContact | null>(null);
  const [stats, setStats] = useState<EmergencyStats>({
    total_sos: 0,
    total_missing: 0,
    total_rescued: 0,
    total_active_disasters: 0,
    total_relief_camps: 0
  });
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchEmergencyStats();
  }, []); // Only fetch stats once on mount

  useEffect(() => {
    if (selectedDistrict) {
      fetchDistrictContact();
    }
  }, [selectedDistrict]); // Only fetch district contact when district changes

  const fetchEmergencyStats = async () => {
    try {
      // Fetch SOS count
      const sosResponse = await axios.get(`${API_BASE_URL}/api/public/sos-signals?limit=10000`);
      const sosCount = sosResponse.data.success ? sosResponse.data.count || sosResponse.data.data.length : 0;

      // Fetch disasters count
      const disastersResponse = await axios.get(`${API_BASE_URL}/api/public/disasters`);
      const activeDisasters = disastersResponse.data.success 
        ? disastersResponse.data.data.filter((d: any) => d.status === 'active').length 
        : 0;

      // HYBRID DATA: Fetch relief camps count from Supabase (requests + contributions) and MongoDB
      const reliefResponse = await axios.get(`${API_BASE_URL}/api/public/relief-camps?type=all&limit=1000`);
      const supabaseRequestsCount = reliefResponse.data.success 
        ? (reliefResponse.data.data.requests?.length || 0) 
        : 0;
      const supabaseContributionsCount = reliefResponse.data.success 
        ? (reliefResponse.data.data.contributions?.length || 0) 
        : 0;

      // Also count MongoDB help requests
      const mongoHelpResponse = await axios.get(`${API_BASE_URL}/api/public/user-reports?status=pending&limit=1000`);
      const mongoHelpCount = mongoHelpResponse.data.success ? mongoHelpResponse.data.data.length : 0;

      const totalReliefCount = supabaseRequestsCount + supabaseContributionsCount + mongoHelpCount;

      setStats({
        total_sos: sosCount,
        total_missing: 282, // Mock data - would need missing persons API
        total_rescued: 180, // Mock data - would need rescue tracking API
        total_active_disasters: activeDisasters,
        total_relief_camps: totalReliefCount
      });

      console.log(`✅ Loaded emergency stats: ${sosCount} SOS, ${activeDisasters} disasters, ${totalReliefCount} relief locations (${supabaseRequestsCount} requests + ${supabaseContributionsCount} contributions + ${mongoHelpCount} MongoDB)`);
    } catch (error) {
      console.error('Error fetching emergency stats:', error);
    }
  };

  const fetchDistrictContact = async () => {
    setLoading(true);
    try {
      console.log(`📞 Fetching DDMCU contact for ${selectedDistrict}...`);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/public/ddmcu-contacts?district=${selectedDistrict}`
      );

      if (response.data.success && response.data.data) {
        console.log(`✅ Loaded DDMCU contact for ${selectedDistrict} (source: ${response.data.source})`);
        setDistrictContact(response.data.data);
        
        // Show notification if using local data (not yet in Supabase)
        if (response.data.source === 'local' && response.data.note) {
          console.log(`ℹ️ ${response.data.note}`);
        }
      } else {
        toast.error('District contact information not available');
      }
    } catch (error) {
      console.error('Error fetching district contact:', error);
      toast.error('Failed to load district contact');
      
      // Fallback to showing unavailable message
      setDistrictContact({
        district: selectedDistrict,
        district_si: selectedDistrict,
        district_ta: selectedDistrict,
        officer_name: 'Contact Information Not Available',
        officer_title: 'Deputy Director (District)',
        office_phone: 'N/A',
        mobile_phone: 'N/A'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
    toast.success(`Dialing ${number}...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <CitizenNavbar />
      
      {/* Page Title Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-3">
            <Phone className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Emergency Contacts</h1>
              <p className="text-red-100 text-sm">24/7 Emergency Response Numbers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Emergency Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="h-7 w-7 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">National Emergency Overview</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">🚨 Total SOS</p>
              <p className="text-3xl font-bold text-red-600">{stats.total_sos.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">👥 Missing Persons</p>
              <p className="text-3xl font-bold text-orange-600">{stats.total_missing.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">✅ Rescued</p>
              <p className="text-3xl font-bold text-green-600">{stats.total_rescued.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">⚠️ Active Disasters</p>
              <p className="text-3xl font-bold text-purple-600">{stats.total_active_disasters.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">⛺ Relief Camps</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total_relief_camps.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* General Emergency Numbers */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">General Emergency Numbers</h2>
            <span className="text-sm text-gray-600">🇱🇰 Sri Lanka</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {EMERGENCY_NUMBERS.map((emergency) => (
              <button
                key={emergency.number}
                onClick={() => handleCall(emergency.number)}
                className={`${emergency.color} text-white rounded-xl p-4 md:p-6 hover:opacity-90 transition-all transform hover:scale-105 shadow-lg`}
              >
                <div className="text-center">
                  <div className="text-3xl md:text-4xl mb-2">{emergency.icon}</div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{emergency.number}</div>
                  <div className="text-base md:text-lg font-semibold">{emergency.label}</div>
                  <div className="text-xs md:text-sm mt-2 opacity-90">Tap to call</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> For immediate life-threatening emergencies, call <strong>117</strong> first.
            </p>
          </div>
        </div>

        {/* District Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <MapPin className="h-7 w-7 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">District Disaster Management Centre Units</h2>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your District
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full md:w-1/2 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SRI_LANKA_DISTRICTS.sort().map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading contact information...</span>
            </div>
          ) : districtContact ? (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {districtContact.district} DDMCU
                  </h3>
                  <p className="text-sm text-gray-600">District Disaster Management Centre Unit</p>
                </div>
                <Shield className="h-10 w-10 text-blue-600" />
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Officer in Charge</p>
                  <p className="text-lg font-bold text-gray-900">{districtContact.officer_name}</p>
                  <p className="text-sm text-gray-600">{districtContact.officer_title}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleCall(districtContact.office_phone)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 transition-colors flex items-center justify-between"
                  >
                    <div className="text-left">
                      <p className="text-sm opacity-90">Office Phone</p>
                      <p className="text-lg font-bold">{districtContact.office_phone}</p>
                    </div>
                    <Phone className="h-6 w-6" />
                  </button>

                  <button
                    onClick={() => handleCall(districtContact.mobile_phone)}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-4 transition-colors flex items-center justify-between"
                  >
                    <div className="text-left">
                      <p className="text-sm opacity-90">Mobile Phone</p>
                      <p className="text-lg font-bold">{districtContact.mobile_phone}</p>
                    </div>
                    <Phone className="h-6 w-6" />
                  </button>
                </div>

                {districtContact.email && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <a 
                      href={`mailto:${districtContact.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {districtContact.email}
                    </a>
                  </div>
                )}

                {districtContact.address && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="text-gray-900">{districtContact.address}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> This is the official contact for disaster management in your district. 
                  For immediate life-threatening emergencies, call <strong>117</strong> first.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p>No contact information available for this district</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/citizen/sos')}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-4 transition-colors flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Send SOS Signal</span>
            </button>
            <button
              onClick={() => navigate('/citizen/report')}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-4 transition-colors flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Report Incident</span>
            </button>
            <button
              onClick={() => navigate('/citizen/map')}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 transition-colors flex items-center justify-center space-x-2"
            >
              <MapPin className="h-5 w-5" />
              <span className="font-semibold">View Risk Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactsPage;
