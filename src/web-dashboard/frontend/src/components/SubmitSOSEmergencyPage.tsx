import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Users, Send, CheckCircle } from 'lucide-react';
import { externalDataService } from '../services/externalDataService';
import toast from 'react-hot-toast';

const SubmitSOSEmergencyPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    alternatePhone: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    address: '',
    landmark: '',
    district: '',
    emergencyType: 'TRAPPED' as any,
    numberOfPeople: 1,
    hasChildren: false,
    hasElderly: false,
    hasDisabled: false,
    hasMedicalEmergency: false,
    medicalDetails: '',
    waterLevel: '' as any,
    buildingType: '',
    floorLevel: undefined as number | undefined,
    safeForHours: undefined as number | undefined,
    description: '',
    hasFood: false,
    hasWater: false,
    hasPowerBank: false,
    batteryPercentage: undefined as number | undefined,
    title: '',
  });

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          toast.success('Location detected automatically');
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Could not detect location. Please enable location access.');
        }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.phoneNumber) {
      toast.error('Please fill in required fields');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error('Location is required. Please enable location access or enter manually.');
      return;
    }

    try {
      setLoading(true);

      const submissionData = {
        ...formData,
        source: 'PUBLIC',
      };

      const response = await externalDataService.submitSOSEmergency(submissionData);

      if (response.success) {
        setSubmitted(true);
        setReferenceNumber(response.data.referenceNumber);
        toast.success('Emergency request submitted successfully!');
      } else {
        toast.error('Failed to submit emergency request');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit emergency request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-green-200">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Emergency Request Submitted
            </h1>
            
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Reference Number</p>
              <p className="text-2xl font-bold text-green-700">{referenceNumber}</p>
            </div>

            <div className="text-left bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                What Happens Next?
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Your emergency request has been sent to the FloodSupport.org system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Emergency responders will be notified immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>Keep your phone charged and accessible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  <span>Save your reference number: <strong>{referenceNumber}</strong></span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ If you are in immediate danger, also call emergency services: <strong>119</strong>
              </p>
            </div>

            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  fullName: '',
                  phoneNumber: '',
                  alternatePhone: '',
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                  address: '',
                  landmark: '',
                  district: '',
                  emergencyType: 'TRAPPED',
                  numberOfPeople: 1,
                  hasChildren: false,
                  hasElderly: false,
                  hasDisabled: false,
                  hasMedicalEmergency: false,
                  medicalDetails: '',
                  waterLevel: '',
                  buildingType: '',
                  floorLevel: undefined,
                  safeForHours: undefined,
                  description: '',
                  hasFood: false,
                  hasWater: false,
                  hasPowerBank: false,
                  batteryPercentage: undefined,
                  title: '',
                });
              }}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sriLankaDistricts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Monaragala', 'Ratnapura', 'Kegalle'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10 border border-red-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              Submit Emergency Request
            </h1>
            <p className="text-gray-600 mb-4">
              Fill out this form to request emergency assistance during a disaster
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ For immediate life-threatening emergencies, call <strong>119</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+94771234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+94712345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title/Summary
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief summary of emergency"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Location Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select District</option>
                    {sriLankaDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nearby landmark"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude {formData.latitude && '✓'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Auto-detected"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude {formData.longitude && '✓'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Auto-detected"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Details */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Emergency Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="emergencyType"
                    value={formData.emergencyType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="TRAPPED">Trapped</option>
                    <option value="MEDICAL">Medical Emergency</option>
                    <option value="FOOD_WATER">Need Food/Water</option>
                    <option value="RESCUE_NEEDED">Rescue Needed</option>
                    <option value="SHELTER_NEEDED">Shelter Needed</option>
                    <option value="MISSING_PERSON">Missing Person</option>
                    <option value="RESCUE_ASSISTANCE_H">Rescue Assistance (High)</option>
                    <option value="MEDICAL_ASSISTANCE_H">Medical Assistance (High)</option>
                    <option value="COOKED_FOOD_H">Need Cooked Food</option>
                    <option value="DRINKING_WATER_H">Need Drinking Water</option>
                    <option value="DRY_FOOD_H">Need Dry Food</option>
                    <option value="SHELTER_H">Need Shelter</option>
                    <option value="CLOTHING_H">Need Clothing</option>
                    <option value="SANITARY_MATERIALS_H">Need Sanitary Materials</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of People
                  </label>
                  <input
                    type="number"
                    name="numberOfPeople"
                    value={formData.numberOfPeople}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Water Level
                  </label>
                  <select
                    name="waterLevel"
                    value={formData.waterLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Water Level</option>
                    <option value="ANKLE">Ankle</option>
                    <option value="KNEE">Knee</option>
                    <option value="WAIST">Waist</option>
                    <option value="CHEST">Chest</option>
                    <option value="NECK">Neck</option>
                    <option value="ROOF">On Roof</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Type
                  </label>
                  <input
                    type="text"
                    name="buildingType"
                    value={formData.buildingType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="House, Apartment, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor Level
                  </label>
                  <input
                    type="number"
                    name="floorLevel"
                    value={formData.floorLevel || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1, 2, 3..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Safe for (hours)
                  </label>
                  <input
                    type="number"
                    name="safeForHours"
                    value={formData.safeForHours || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Estimated hours"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your emergency situation in detail"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasChildren"
                    checked={formData.hasChildren}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm">Has Children</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasElderly"
                    checked={formData.hasElderly}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm">Has Elderly</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasDisabled"
                    checked={formData.hasDisabled}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm">Has Disabled</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasMedicalEmergency"
                    checked={formData.hasMedicalEmergency}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm">Medical Emergency</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasFood"
                    checked={formData.hasFood}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm">Has Food</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasWater"
                    checked={formData.hasWater}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm">Has Water</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasPowerBank"
                    checked={formData.hasPowerBank}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm">Has Power Bank</span>
                </label>

                <div>
                  <input
                    type="number"
                    name="batteryPercentage"
                    value={formData.batteryPercentage || ''}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Battery %"
                  />
                </div>
              </div>

              {formData.hasMedicalEmergency && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Details
                  </label>
                  <textarea
                    name="medicalDetails"
                    value={formData.medicalDetails}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the medical emergency"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Emergency Request
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              By submitting this form, you confirm that this is a genuine emergency request.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitSOSEmergencyPage;
