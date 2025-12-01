import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Location {
  lat: number;
  lng: number;
}

type ReportType = 'food' | 'shelter' | 'danger' | 'medical';

const CitizenReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<ReportType>('food');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
          setLocation({ lat: 6.9271, lng: 79.8612 });
          toast.error('Using default location. Enable GPS for accuracy.');
        }
      );
    } else {
      setLocation({ lat: 6.9271, lng: 79.8612 });
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please provide a description of the incident');
      return;
    }

    if (description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    if (!location) {
      toast.error('Unable to get your location');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/reports`,
        {
          type: reportType,
          description: description,
          location: {
            lat: location.lat,
            lng: location.lng,
          },
        }
      );

      if (response.data.success) {
        setSubmitted(true);
        toast.success('Report submitted successfully!');
        
        setTimeout(() => {
          navigate('/citizen');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Report submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      value: 'food',
      label: 'Food Shortage',
      icon: '🍽️',
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      activeColor: 'bg-orange-500 border-orange-600 text-white',
    },
    {
      value: 'shelter',
      label: 'Shelter Needed',
      icon: '🏠',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      activeColor: 'bg-blue-500 border-blue-600 text-white',
    },
    {
      value: 'medical',
      label: 'Medical Emergency',
      icon: '🏥',
      color: 'bg-red-100 border-red-300 text-red-800',
      activeColor: 'bg-red-500 border-red-600 text-white',
    },
    {
      value: 'danger',
      label: 'Danger Alert',
      icon: '⚠️',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      activeColor: 'bg-yellow-500 border-yellow-600 text-white',
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Report Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your incident report has been received. Emergency responders will be notified.
            </p>
            <button
              onClick={() => navigate('/citizen')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/citizen')}
                className="p-2 hover:bg-green-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Report Incident</h1>
                <p className="text-green-100 text-sm">Help us track disasters in your area</p>
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
        <div className="max-w-2xl mx-auto">
          {/* Report Type Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Report Type</h3>
            <div className="grid grid-cols-2 gap-4">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value as ReportType)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    reportType === type.value ? type.activeColor : type.color
                  }`}
                >
                  <div className="text-4xl mb-2">{type.icon}</div>
                  <div className="font-semibold">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Location Display */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Report Location</h3>
            </div>
            {location ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Incident location:</p>
                <div className="font-mono text-sm text-gray-800">
                  <p>📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Getting location...</p>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Incident Description</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incident in detail... (minimum 10 characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={6}
              maxLength={1000}
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-2">{description.length}/1000 characters</p>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Reporting Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Be specific and accurate in your description</li>
              <li>Include important details like number of people affected</li>
              <li>For medical emergencies, also call 1990</li>
              <li>False reports may result in penalties</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !location || description.trim().length < 10}
            className={`w-full py-4 rounded-xl text-white text-lg font-bold transition-all ${
              loading || !location || description.trim().length < 10
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700 shadow-lg'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Submitting Report...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <AlertTriangle className="h-6 w-6" />
                <span>Submit Report</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitizenReportPage;
