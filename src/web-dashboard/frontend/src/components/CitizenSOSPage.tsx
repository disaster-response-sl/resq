import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

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
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/sos`,
        {
          location: {
            lat: location.lat,
            lng: location.lng,
          },
          message: message || 'Emergency SOS - Need immediate assistance',
          priority: 'high',
        }
      );

      if (response.data.success) {
        setSent(true);
        toast.success('SOS sent successfully! Help is on the way.');
        
        // Reset after 5 seconds
        setTimeout(() => {
          setSent(false);
          setMessage('');
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

          {/* Message Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Details (Optional)</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your emergency (optional)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
              disabled={sending || sent}
            />
            <p className="text-sm text-gray-500 mt-2">{message.length}/500 characters</p>
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
