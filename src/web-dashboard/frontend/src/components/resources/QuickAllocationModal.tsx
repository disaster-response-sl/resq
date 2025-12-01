import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllResources, allocateResource } from '../../services/resourceService';
import { Resource } from '../../types/resource';
import { X, Package, MapPin, Search, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuickAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QuickAllocationModal: React.FC<QuickAllocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allocationData, setAllocationData] = useState({
    quantity: 1,
    disaster_id: '',
    location: {
      lat: 0,
      lng: 0,
      address: ''
    },
    estimated_duration: 24
  });

  const fetchAvailableResources = useCallback(async () => {
    if (!token) {
      console.error('No authentication token available');
      toast.error('Authentication required');
      return;
    }

    try {
      setLoading(true);
      const response = await getAllResources(token, {
        status: 'available',
        limit: 50,
        sortBy: 'priority',
        sortOrder: 'desc'
      });
      // Filter resources with available quantity > 0
      const availableResources = (response.data || []).filter(
        (resource: Resource) => resource.available_quantity > 0
      );
      setResources(availableResources);
      setFilteredResources(availableResources);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
      toast.error('Failed to load available resources');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen && token) {
      fetchAvailableResources();
    }
  }, [isOpen, token, fetchAvailableResources]);

  // Filter resources based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResources(resources);
    } else {
      const filtered = resources.filter(resource =>
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredResources(filtered);
    }
  }, [searchQuery, resources]);

  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource(resource);
    setAllocationData(prev => ({
      ...prev,
      quantity: Math.min(1, resource.available_quantity)
    }));
  };

  const handleAllocation = async () => {
    if (!selectedResource || !token) return;

    // Validate required fields
    if (allocationData.location.lat === 0 && allocationData.location.lng === 0) {
      toast.error('Please provide valid deployment coordinates');
      return;
    }

    if (!allocationData.disaster_id.trim()) {
      toast.error('Disaster ID is required');
      return;
    }

    if (allocationData.quantity > selectedResource.available_quantity) {
      toast.error(`Cannot allocate more than ${selectedResource.available_quantity} units`);
      return;
    }

    if (allocationData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const finalAllocationData = {
        ...allocationData,
        disaster_id: allocationData.disaster_id
      };
      await allocateResource(token, selectedResource._id, finalAllocationData);
      toast.success(`Successfully allocated ${allocationData.quantity} units of ${selectedResource.name}`);
      onSuccess();
      onClose();
      setSelectedResource(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Allocation failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setAllocationData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field: string, value: string | number) => {
    setAllocationData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Resource Allocation</h2>
            <p className="text-gray-600 mt-1">Select and allocate resources for disaster response</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Panel - Resource Selection */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search resources by name, type, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-600">
                  {filteredResources.length} resources available
                </span>
                <button
                  onClick={fetchAvailableResources}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Resource List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-700">Loading Resources</p>
                    <p className="text-sm text-gray-500">Fetching available resources...</p>
                  </div>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-full">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900">No Resources Found</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {searchQuery ? 'Try adjusting your search criteria' : 'No resources are currently available for allocation'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredResources.map((resource) => (
                    <div
                      key={resource._id}
                      onClick={() => handleResourceSelect(resource)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedResource?._id === resource._id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Package className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                              <p className="text-sm text-gray-600 capitalize">
                                {resource.type} • {resource.category}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-3 h-3 mr-1" />
                              {resource.location.address || `${resource.location.lat.toFixed(4)}, ${resource.location.lng.toFixed(4)}`}
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                resource.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                resource.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                resource.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {resource.priority}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {resource.available_quantity} available
                            </span>
                            <span className="text-sm text-gray-500">
                              of {typeof resource.quantity === 'object' ? resource.quantity.current : resource.quantity} total
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Allocation Form */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Allocation Details</h3>
              <p className="text-gray-600 mt-1">Configure deployment parameters</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedResource ? (
                <div className="space-y-6">
                  {/* Selected Resource Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900">{selectedResource.name}</h4>
                        <p className="text-sm text-blue-700 capitalize">
                          {selectedResource.type} • {selectedResource.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">{selectedResource.available_quantity}</span> units available for allocation
                    </div>
                  </div>

                  {/* Allocation Form */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity to Allocate
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedResource.available_quantity}
                        value={allocationData.quantity}
                        onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum: {selectedResource.available_quantity} units
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Disaster ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={allocationData.disaster_id}
                        onChange={(e) => handleInputChange('disaster_id', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter the disaster ID to allocate resources to"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the ID of an existing disaster record
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Duration (hours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={allocationData.estimated_duration}
                        onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 24)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {/* Deployment Location */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Deployment Location</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Latitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={allocationData.location.lat}
                            onChange={(e) => handleLocationChange('lat', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Longitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={allocationData.location.lng}
                            onChange={(e) => handleLocationChange('lng', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={allocationData.location.address}
                          onChange={(e) => handleLocationChange('address', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Deployment address"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-full">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900">Select a Resource</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Choose a resource from the list to configure allocation details
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all font-medium"
                >
                  Cancel
                </button>
                {selectedResource ? (
                  <button
                    onClick={handleAllocation}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-semibold text-base"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Allocating...</span>
                      </div>
                    ) : (
                      'Allocate Resource'
                    )}
                  </button>
                ) : (
                  <div className="px-8 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-semibold text-base">
                    Select Resource First
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAllocationModal;
