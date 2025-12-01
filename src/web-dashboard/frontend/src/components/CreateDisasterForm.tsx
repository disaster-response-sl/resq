import React, { useState } from 'react';
import { X, MapPin, AlertTriangle, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { disasterService, CreateDisasterRequest, Zone } from '../services/disasterService';

interface CreateDisasterFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateDisasterForm: React.FC<CreateDisasterFormProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDisasterRequest>({
    type: 'flood',
    severity: 'medium',
    title: '',
    description: '',
    location: { lat: 0, lng: 0 },
    zones: [],
    priority_level: 'medium',
    incident_commander: '',
    contact_number: '',
    reporting_agency: '',
    public_alert: true,
    alert_message: '',
    evacuation_required: false,
    evacuation_zones: [],
    assigned_teams: [],
    estimated_duration: 0
  });
  
  const [currentZone, setCurrentZone] = useState<Partial<Zone>>({
    zone_name: '',
    boundary_coordinates: [],
    estimated_population: 0,
    area_km2: 0,
    risk_level: 'medium'
  });

  const [showZoneForm, setShowZoneForm] = useState(false);

  const handleInputChange = (field: keyof CreateDisasterRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field: 'lat' | 'lng', value: number) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location!,
        [field]: value
      }
    }));
  };

  const handleZoneInputChange = (field: keyof Zone, value: any) => {
    setCurrentZone(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addZone = () => {
    if (!currentZone.zone_name) {
      toast.error('Zone name is required');
      return;
    }

    const zone: Zone = {
      zone_name: currentZone.zone_name,
      boundary_coordinates: currentZone.boundary_coordinates || [],
      estimated_population: currentZone.estimated_population || 0,
      area_km2: currentZone.area_km2 || 0,
      risk_level: currentZone.risk_level || 'medium'
    };

    setFormData(prev => ({
      ...prev,
      zones: [...(prev.zones || []), zone]
    }));

    setCurrentZone({
      zone_name: '',
      boundary_coordinates: [],
      estimated_population: 0,
      area_km2: 0,
      risk_level: 'medium'
    });

    setShowZoneForm(false);
    toast.success('Zone added successfully');
  };

  const removeZone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      zones: prev.zones?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    setLoading(true);
    try {
      await disasterService.createDisaster(formData);
      toast.success('Disaster created successfully');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create disaster');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">Create New Disaster</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter disaster title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="flood">Flood</option>
                  <option value="landslide">Landslide</option>
                  <option value="cyclone">Cyclone</option>
                  <option value="fire">Fire</option>
                  <option value="earthquake">Earthquake</option>
                  <option value="drought">Drought</option>
                  <option value="tsunami">Tsunami</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.severity}
                  onChange={(e) => handleInputChange('severity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={formData.priority_level}
                  onChange={(e) => handleInputChange('priority_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide detailed description of the disaster"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.location?.lat || ''}
                  onChange={(e) => handleLocationChange('lat', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="6.9271"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.location?.lng || ''}
                  onChange={(e) => handleLocationChange('lng', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="79.8612"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incident Commander
                </label>
                <input
                  type="text"
                  value={formData.incident_commander || ''}
                  onChange={(e) => handleInputChange('incident_commander', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Name of incident commander"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.contact_number || ''}
                  onChange={(e) => handleInputChange('contact_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+94 11 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reporting Agency
                </label>
                <input
                  type="text"
                  value={formData.reporting_agency || ''}
                  onChange={(e) => handleInputChange('reporting_agency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Disaster Management Centre"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 mr-1" />
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimated_duration || ''}
                  onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="24"
                />
              </div>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alert Settings
            </h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="public_alert"
                  checked={formData.public_alert || false}
                  onChange={(e) => handleInputChange('public_alert', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="public_alert" className="ml-2 text-sm text-gray-700">
                  Send public alert
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="evacuation_required"
                  checked={formData.evacuation_required || false}
                  onChange={(e) => handleInputChange('evacuation_required', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="evacuation_required" className="ml-2 text-sm text-gray-700">
                  Evacuation required
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Message
                </label>
                <textarea
                  value={formData.alert_message || ''}
                  onChange={(e) => handleInputChange('alert_message', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Public alert message (max 500 characters)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.alert_message || '').length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Zones Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">Affected Zones</h4>
              <button
                type="button"
                onClick={() => setShowZoneForm(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Add Zone
              </button>
            </div>

            {formData.zones && formData.zones.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.zones.map((zone, index) => (
                  <div key={index} className="flex justify-between items-center bg-white p-3 rounded border">
                    <div>
                      <span className="font-medium">{zone.zone_name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        Pop: {zone.estimated_population || 0} | Area: {zone.area_km2 || 0} km²
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeZone(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showZoneForm && (
              <div className="bg-white p-4 rounded border space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zone Name
                    </label>
                    <input
                      type="text"
                      value={currentZone.zone_name || ''}
                      onChange={(e) => handleZoneInputChange('zone_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Zone name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Risk Level
                    </label>
                    <select
                      value={currentZone.risk_level || 'medium'}
                      onChange={(e) => handleZoneInputChange('risk_level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Population
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={currentZone.estimated_population || ''}
                      onChange={(e) => handleZoneInputChange('estimated_population', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (km²)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={currentZone.area_km2 || ''}
                      onChange={(e) => handleZoneInputChange('area_km2', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5.5"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={addZone}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Add Zone
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowZoneForm(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Disaster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDisasterForm;
