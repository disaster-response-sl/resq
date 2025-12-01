import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, AlertCircle, ArrowLeft, CheckCircle, ChevronDown, ChevronUp, User, Users, Home } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { citizenAuthService } from '../services/citizenAuthService';

interface Location {
  lat: number;
  lng: number;
}

const CitizenSOSPage: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<Location | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Contact Information (Optional)
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  
  // Location Details (Optional)
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [district, setDistrict] = useState('');
  
  // Emergency Details (Optional)
  const [emergencyType, setEmergencyType] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [hasChildren, setHasChildren] = useState(false);
  const [hasElderly, setHasElderly] = useState(false);
  const [hasDisabled, setHasDisabled] = useState(false);
  const [hasMedical, setHasMedical] = useState(false);
  
  // Current Situation (Optional)
  const [waterLevel, setWaterLevel] = useState('');
  const [safeDuration, setSafeDuration] = useState('');
  const [buildingType, setBuildingType] = useState('');
  const [floorLevel, setFloorLevel] = useState('');
  
  // Resources (Optional)
  const [hasFood, setHasFood] = useState(false);
  const [hasWater, setHasWater] = useState(false);
  const [hasPower, setHasPower] = useState(false);
  const [batteryPercent, setBatteryPercent] = useState('');

  const districts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Monaragala', 'Ratnapura', 'Kegalle'
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          // Default to Colombo
          setLocation({ lat: 6.9271, lng: 79.8612 });
          toast.error('Using default location. Please enable GPS for accurate location.');
        }
      );
    } else {
      setLocation({ lat: 6.9271, lng: 79.8612 });
      toast.error('Geolocation not supported. Using default location.');
    }
  };

  const handleSendSOS = async () => {
    if (!location) {
      toast.error('Unable to get your location. Please try again.');
      return;
    }

    setSending(true);

    try {
      // Get token if user is logged in
      const token = citizenAuthService.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      console.log('[CITIZEN SOS] Token:', token ? 'Present' : 'Not found');
      console.log('[CITIZEN SOS] Sending with headers:', headers);

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/sos`,
        {
          location: {
            lat: location.lat,
            lng: location.lng,
          },
          message: message || 'Emergency SOS - Need immediate assistance',
          priority: 'high',
          // Optional contact details
          contact: fullName || phoneNumber || alternatePhone ? {
            fullName: fullName || undefined,
            phoneNumber: phoneNumber || undefined,
            alternatePhone: alternatePhone || undefined,
          } : undefined,
          // Optional location details
          locationDetails: address || landmark || district ? {
            address: address || undefined,
            landmark: landmark || undefined,
            district: district || undefined,
          } : undefined,
          // Optional emergency details
          emergencyDetails: emergencyType || numberOfPeople || hasChildren || hasElderly || hasDisabled || hasMedical ? {
            type: emergencyType || undefined,
            numberOfPeople: numberOfPeople ? parseInt(numberOfPeople) : undefined,
            hasChildren,
            hasElderly,
            hasDisabled,
            hasMedical,
          } : undefined,
          // Optional current situation
          currentSituation: waterLevel || safeDuration || buildingType || floorLevel ? {
            waterLevel: waterLevel || undefined,
            safeDuration: safeDuration || undefined,
            buildingType: buildingType || undefined,
            floorLevel: floorLevel || undefined,
          } : undefined,
          // Optional resources
          resources: {
            hasFood,
            hasWater,
            hasPower,
            batteryPercent: batteryPercent ? parseInt(batteryPercent) : undefined,
          },
        },
        { headers }
      );

      if (response.data.success) {
        setSent(true);
        toast.success('SOS sent successfully! Help is on the way.');
        
        // Reset after 5 seconds
        setTimeout(() => {
          setSent(false);
          setMessage('');
          setFullName('');
          setPhoneNumber('');
          setAlternatePhone('');
          setAddress('');
          setLandmark('');
          setDistrict('');
          setEmergencyType('');
          setNumberOfPeople('');
          setHasChildren(false);
          setHasElderly(false);
          setHasDisabled(false);
          setHasMedical(false);
          setWaterLevel('');
          setSafeDuration('');
          setBuildingType('');
          setFloorLevel('');
          setHasFood(false);
          setHasWater(false);
          setHasPower(false);
          setBatteryPercent('');
          setShowDetails(false);
        }, 5000);
      }
    } catch (error: any) {
      console.error('SOS send error:', error);
      toast.error(error.response?.data?.message || 'Failed to send SOS. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/citizen')}
                className="p-2 hover:bg-red-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Emergency SOS</h1>
                <p className="text-red-100 text-sm">Send distress signal with your location</p>
              </div>
            </div>
            <img 
              src="/favicon.png" 
              alt="Sri Lanka Disaster Response Platform" 
              className="h-12 w-12"
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Warning Banner */}
          <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded-lg mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-800 mb-1">Emergency Use Only</h3>
                <p className="text-red-700 text-sm">
                  This SOS button is for life-threatening emergencies only. Misuse may result in penalties.
                  Your location will be shared with emergency responders.
                </p>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Your Location</h3>
            </div>
            {location ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Location will be sent with SOS:</p>
                <div className="font-mono text-sm text-gray-800">
                  <p>📍 Latitude: {location.lat.toFixed(6)}</p>
                  <p>📍 Longitude: {location.lng.toFixed(6)}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500">Getting your location...</p>
              </div>
            )}
          </div>

          {/* Quick Message Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Message (Optional)</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Briefly describe your emergency..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
              disabled={sending || sent}
            />
            <p className="text-sm text-gray-500 mt-2">{message.length}/500 characters</p>
          </div>

          {/* Expandable Detailed Form */}
          <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              type="button"
              disabled={sending || sent}
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Provide More Details (Optional)
                </h3>
              </div>
              {showDetails ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {showDetails && (
              <div className="px-6 pb-6 space-y-6">
                {/* Contact Information */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">Contact Information</h4>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone Number (e.g., 0771234567)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    />
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      placeholder="Alternate Phone Number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    />
                  </div>
                </div>

                {/* Location Details */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">Location Details</h4>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Address / Area Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    />
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Nearby Landmark"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    />
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    >
                      <option value="">Select District</option>
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Emergency Details */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-gray-800">Emergency Details</h4>
                  </div>
                  <div className="space-y-3">
                    <select
                      value={emergencyType}
                      onChange={(e) => setEmergencyType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    >
                      <option value="">Select Emergency Type</option>
                      <option value="flood">Trapped by Flood</option>
                      <option value="landslide">Landslide</option>
                      <option value="cyclone">Cyclone/Storm</option>
                      <option value="fire">Fire</option>
                      <option value="building_collapse">Building Collapse</option>
                      <option value="medical">Medical Emergency</option>
                      <option value="other">Other Emergency</option>
                    </select>
                    <input
                      type="number"
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(e.target.value)}
                      placeholder="Number of People Affected"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasChildren}
                          onChange={(e) => setHasChildren(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={sending || sent}
                        />
                        <span className="text-sm text-gray-700">Children Present</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasElderly}
                          onChange={(e) => setHasElderly(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={sending || sent}
                        />
                        <span className="text-sm text-gray-700">Elderly Present</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasDisabled}
                          onChange={(e) => setHasDisabled(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={sending || sent}
                        />
                        <span className="text-sm text-gray-700">Disabled Person</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasMedical}
                          onChange={(e) => setHasMedical(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={sending || sent}
                        />
                        <span className="text-sm text-gray-700">Medical Needs</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Current Situation */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Home className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">Current Situation</h4>
                  </div>
                  <div className="space-y-3">
                    <select
                      value={waterLevel}
                      onChange={(e) => setWaterLevel(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    >
                      <option value="">Water Level (if flooded)</option>
                      <option value="ankle">Ankle Level</option>
                      <option value="knee">Knee Level</option>
                      <option value="waist">Waist Level</option>
                      <option value="chest">Chest Level</option>
                      <option value="neck">Neck Level / Rising Fast</option>
                    </select>
                    <input
                      type="text"
                      value={safeDuration}
                      onChange={(e) => setSafeDuration(e.target.value)}
                      placeholder="How long can you stay safe? (e.g., 2 hours)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    />
                    <select
                      value={buildingType}
                      onChange={(e) => setBuildingType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    >
                      <option value="">Building Type</option>
                      <option value="concrete">Concrete Building</option>
                      <option value="brick">Brick Building</option>
                      <option value="wood">Wooden Structure</option>
                      <option value="tin">Tin/Temporary Shelter</option>
                    </select>
                    <input
                      type="text"
                      value={floorLevel}
                      onChange={(e) => setFloorLevel(e.target.value)}
                      placeholder="Floor Level (e.g., Ground Floor, 2nd Floor)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    />
                  </div>
                </div>

                {/* Available Resources */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">Available Resources</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasFood}
                          onChange={(e) => setHasFood(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={sending || sent}
                        />
                        <span className="text-sm text-gray-700">Food</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasWater}
                          onChange={(e) => setHasWater(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={sending || sent}
                        />
                        <span className="text-sm text-gray-700">Water</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasPower}
                          onChange={(e) => setHasPower(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={sending || sent}
                        />
                        <span className="text-sm text-gray-700">Power</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      value={batteryPercent}
                      onChange={(e) => setBatteryPercent(e.target.value)}
                      placeholder="Phone Battery Percentage (%)"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending || sent}
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                  💡 All these fields are optional. Provide as much detail as possible to help responders assist you better, but you can submit with just your location if needed.
                </p>
              </div>
            )}
          </div>

          {/* SOS Button */}
          {!sent ? (
            <button
              onClick={handleSendSOS}
              disabled={sending || !location}
              className={`w-full py-8 rounded-2xl shadow-2xl text-white text-2xl font-bold transition-all transform ${
                sending
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95'
              } ${!location ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {sending ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span>Sending SOS...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <Phone className="h-10 w-10" />
                  <span>SEND SOS EMERGENCY</span>
                </div>
              )}
            </button>
          ) : (
            <div className="bg-green-100 border-2 border-green-600 rounded-2xl p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-800 mb-2">SOS Sent Successfully!</h3>
              <p className="text-green-700">
                Emergency responders have been notified of your location. Help is on the way.
              </p>
            </div>
          )}

          {/* Emergency Contacts */}
          <div className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Alternative Emergency Contacts</h3>
            <div className="space-y-3">
              <a
                href="tel:119"
                className="flex items-center justify-between bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-800">🚨 Emergency Services</p>
                  <p className="text-sm text-gray-600">For all emergencies</p>
                </div>
                <span className="text-2xl font-bold text-red-600">119</span>
              </a>
              <a
                href="tel:1990"
                className="flex items-center justify-between bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-800">🚑 Ambulance</p>
                  <p className="text-sm text-gray-600">Medical emergencies</p>
                </div>
                <span className="text-2xl font-bold text-red-600">1990</span>
              </a>
              <a
                href="tel:110"
                className="flex items-center justify-between bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-800">🚒 Fire & Rescue</p>
                  <p className="text-sm text-gray-600">Fire emergencies</p>
                </div>
                <span className="text-2xl font-bold text-red-600">110</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenSOSPage;
