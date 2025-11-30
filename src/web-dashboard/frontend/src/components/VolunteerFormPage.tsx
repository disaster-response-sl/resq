import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Package, Users, Truck, MapPin, Phone, Mail, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const VolunteerFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    mobile_number_2: '',
    email: '',
    address: '',
    contribution_types: [] as string[],
    goods_types: [] as string[],
    services_types: [] as string[],
    labor_types: [] as string[],
    coverage_radius_km: '50',
    pickup_required: false,
    availability_notes: '',
    additional_notes: ''
  });

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          setUserLocation({ lat: 6.9271, lng: 79.8612 }); // Default to Colombo
        }
      );
    }
  }, []);

  const handleCheckboxChange = (field: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[field as keyof typeof formData] as string[];
      if (currentValues.includes(value)) {
        return { ...prev, [field]: currentValues.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...currentValues, value] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.mobile_number) {
      toast.error('Please fill in required fields');
      return;
    }

    if (formData.contribution_types.length === 0) {
      toast.error('Please select at least one contribution type');
      return;
    }

    if (!userLocation) {
      toast.error('Unable to get your location. Please enable GPS.');
      return;
    }

    try {
      setLoading(true);
      
      // Submit to Supabase Relief API via backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/public/volunteer`,
        {
          ...formData,
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          status: 'available',
          coverage_radius_km: parseInt(formData.coverage_radius_km)
        }
      );

      if (response.data.success) {
        toast.success('Thank you! Your volunteer registration has been submitted.');
        setTimeout(() => navigate('/citizen/relief-tracker'), 2000);
      }
    } catch (error: any) {
      console.error('Volunteer registration error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/citizen/relief-tracker')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Volunteer Registration</h1>
                <p className="text-green-100 text-sm">Offer your support to those in need</p>
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
        <div className="max-w-4xl mx-auto">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900">
                  <strong>Thank you for volunteering!</strong> Your contribution will be visible to affected residents and disaster coordinators. You can offer goods, services, or labor to help during emergencies.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-green-600" />
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    placeholder="+94771234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile_number_2}
                    onChange={(e) => setFormData({ ...formData, mobile_number_2: e.target.value })}
                    placeholder="+94771234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Contribution Types */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-green-600" />
                What Can You Offer? <span className="text-red-500 ml-1">*</span>
              </h2>

              <div className="space-y-2 mb-4">
                {['Goods', 'Services', 'Labor'].map(type => (
                  <label key={type} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.contribution_types.includes(type)}
                      onChange={() => handleCheckboxChange('contribution_types', type)}
                      className="w-5 h-5 text-green-600"
                    />
                    <span className="font-medium">{type}</span>
                  </label>
                ))}
              </div>

              {/* Goods Types */}
              {formData.contribution_types.includes('Goods') && (
                <div className="ml-8 mb-4">
                  <p className="font-medium text-gray-700 mb-2">Types of Goods:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Food', 'Medicine', 'Clothing', 'Shelter Materials', 'Hygiene Items', 'Other'].map(good => (
                      <label key={good} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.goods_types.includes(good)}
                          onChange={() => handleCheckboxChange('goods_types', good)}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-sm">{good}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Services Types */}
              {formData.contribution_types.includes('Services') && (
                <div className="ml-8 mb-4">
                  <p className="font-medium text-gray-700 mb-2">Types of Services:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Medical', 'Transportation', 'Communication', 'Counseling', 'Legal Aid', 'Other'].map(service => (
                      <label key={service} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.services_types.includes(service)}
                          onChange={() => handleCheckboxChange('services_types', service)}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Labor Types */}
              {formData.contribution_types.includes('Labor') && (
                <div className="ml-8 mb-4">
                  <p className="font-medium text-gray-700 mb-2">Types of Labor:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Construction', 'Rescue', 'Cleanup', 'Distribution', 'Administrative', 'Other'].map(labor => (
                      <label key={labor} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.labor_types.includes(labor)}
                          onChange={() => handleCheckboxChange('labor_types', labor)}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-sm">{labor}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coverage & Availability */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Coverage & Availability
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coverage Radius: {formData.coverage_radius_km} km
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={formData.coverage_radius_km}
                  onChange={(e) => setFormData({ ...formData, coverage_radius_km: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How far are you willing to travel to provide assistance?
                </p>
              </div>

              <div className="mb-4">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pickup_required}
                    onChange={(e) => setFormData({ ...formData, pickup_required: e.target.checked })}
                    className="w-5 h-5 text-green-600"
                  />
                  <div>
                    <span className="font-medium">Pickup Required</span>
                    <p className="text-sm text-gray-600">Check if you need someone to pick up donated items</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability Notes
                </label>
                <textarea
                  value={formData.availability_notes}
                  onChange={(e) => setFormData({ ...formData, availability_notes: e.target.value })}
                  placeholder="e.g., Available weekdays 9AM-5PM, weekends anytime"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                placeholder="Any other information you'd like to share..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/citizen/relief-tracker')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Heart className="h-5 w-5" />
                    <span>Register as Volunteer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VolunteerFormPage;
