import React, { useState } from 'react';
import { Phone, Navigation, Info, X, Users, Droplets, Battery, MapPin, Clock } from 'lucide-react';

interface EnhancedMapCardProps {
  type: 'sos' | 'flood' | 'disaster' | 'relief';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT' | 'CRITICAL' | 'HIGHLY_CRITICAL';
  title: string;
  reference?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  data: Record<string, any>;
  onClose?: () => void;
}

const priorityConfig = {
  'HIGH': { color: 'bg-red-50 text-red-700 border-red-200', label: 'HIGH' },
  'HIGHLY_CRITICAL': { color: 'bg-red-50 text-red-700 border-red-200', label: 'HIGH' },
  'CRITICAL': { color: 'bg-red-50 text-red-700 border-red-200', label: 'HIGH' },
  'URGENT': { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'URGENT' },
  'MEDIUM': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'MEDIUM' },
  'LOW': { color: 'bg-green-50 text-green-700 border-green-200', label: 'LOW' },
};

const typeConfig = {
  sos: { icon: '🚨', label: 'EMERGENCY', color: 'text-red-600' },
  flood: { icon: '💧', label: 'FLOOD', color: 'text-blue-600' },
  disaster: { icon: '⚠️', label: 'DISASTER', color: 'text-orange-600' },
  relief: { icon: '🏕️', label: 'RELIEF', color: 'text-green-600' },
};

export const EnhancedMapCard: React.FC<EnhancedMapCardProps> = ({
  type,
  priority = 'MEDIUM',
  title,
  reference,
  location,
  data,
  onClose,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const config = typeConfig[type];
  const priorityStyle = priorityConfig[priority] || priorityConfig['MEDIUM'];

  const handleCall = () => {
    if (data.phoneNumber || data.phone) {
      window.location.href = `tel:${data.phoneNumber || data.phone}`;
    } else {
      alert('No phone number available');
    }
  };

  const handleDirections = () => {
    // Open Google Maps with directions
    const destination = `${location.lat},${location.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  };

  const DetailModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h2 className={`text-xl font-bold ${config.color}`}>{title}</h2>
              {reference && (
                <p className="text-sm text-gray-500">Ref: {reference}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowDetails(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Emergency Details Section */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              EMERGENCY DETAILS
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Type</p>
                  <p className="font-semibold text-sm text-gray-900">
                    {data.emergencyType?.replace(/_/g, ' ') || data.type || config.label}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">
                    {data.status || 'Active'}
                  </span>
                </div>
              </div>

              {data.numberOfPeople && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">People</p>
                    <p className="font-semibold text-sm text-gray-900 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {data.numberOfPeople}
                    </p>
                  </div>
                </div>
              )}

              {data.waterLevel && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Water Level</p>
                    <p className="font-semibold text-sm text-gray-900 flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      {data.waterLevel}
                    </p>
                  </div>
                  {data.batteryPercentage !== undefined && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Battery</p>
                      <p className="font-semibold text-sm text-gray-900 flex items-center gap-1">
                        <Battery className="h-3 w-3" />
                        {data.batteryPercentage}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {data.safeForHours !== undefined && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Safe For</p>
                  <p className="font-semibold text-sm text-red-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {data.safeForHours} hours
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Location Section */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              LOCATION
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                {location.address || data.address || data.location || 'Location unavailable'}
              </p>
              {data.landmark && (
                <p className="text-xs text-gray-500">{data.landmark}</p>
              )}
              {data.district && (
                <p className="text-xs text-gray-500">{data.district}</p>
              )}
            </div>
          </div>

          {/* Conditions */}
          {(data.hasChildren || data.hasElderly || data.hasDisabled || data.hasMedicalEmergency || data.hasFood || data.hasWater) && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">CONDITIONS</h3>
              <div className="flex flex-wrap gap-2">
                {data.hasChildren && (
                  <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
                    👶 Children
                  </span>
                )}
                {data.hasElderly && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                    👴 Elderly
                  </span>
                )}
                {data.hasDisabled && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                    ♿ Disabled
                  </span>
                )}
                {data.hasMedicalEmergency && (
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                    🏥 Medical Emergency
                  </span>
                )}
                {data.hasFood && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                    🍽️ Has Food
                  </span>
                )}
                {data.hasWater && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                    💧 Has Water
                  </span>
                )}
                {!data.hasFood && type === 'sos' && (
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                    ❌ No Food
                  </span>
                )}
                {!data.hasWater && type === 'sos' && (
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                    ❌ No Water
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Description/Message */}
          {(data.description || data.message || data.remarks) && (
            <div>
              <h3 className="font-bold text-gray-900 mb-2">DETAILS</h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {data.description || data.message || data.remarks}
              </p>
            </div>
          )}

          {/* Additional Info */}
          {data.medicalDetails && (
            <div>
              <h3 className="font-bold text-red-900 mb-2">MEDICAL DETAILS</h3>
              <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg border border-red-100">
                {data.medicalDetails}
              </p>
            </div>
          )}

          {/* Timestamp */}
          {(data.createdAt || data.timestamp) && (
            <p className="text-xs text-gray-400 text-center pt-4 border-t">
              {new Date(data.createdAt || data.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden min-w-[280px] max-w-[320px] sm:max-w-[380px] animate-slideUp">
        {/* Header */}
        <div className="relative">
          {/* Priority Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${priorityStyle.color}`}>
              {priorityStyle.label}
            </span>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          )}

          {/* Icon & Title */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 px-6 py-4 pt-12">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{config.label}</p>
                <h3 className={`text-lg font-bold ${config.color} leading-tight`}>{title}</h3>
                {reference && (
                  <p className="text-xs text-gray-500 mt-1">SOS-{reference}</p>
                )}
                {(data.createdAt || data.timestamp) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {(() => {
                      const date = new Date(data.createdAt || data.timestamp);
                      const now = new Date();
                      const diffMs = now.getTime() - date.getTime();
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      
                      if (diffDays === 0) return 'Today';
                      if (diffDays === 1) return 'Yesterday';
                      return `${diffDays}d ago`;
                    })()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-3">
          {/* People Count */}
          {data.numberOfPeople && (
            <div className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-semibold text-gray-700">People</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">{data.numberOfPeople}</span>
            </div>
          )}

          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 line-clamp-2">
              {location.address || data.address || data.location || 'Location unavailable'}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <Droplets className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <p className="text-xs font-semibold text-gray-900">
                {data.waterLevel || 'N/A'}
              </p>
              <p className="text-[10px] text-gray-500">Water</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <MapPin className="h-4 w-4 mx-auto text-gray-500 mb-1" />
              <p className="text-xs font-semibold text-gray-900">
                {data.floorLevel || data.buildingType || 'N/A'}
              </p>
              <p className="text-[10px] text-gray-500">Floor</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <Battery className="h-4 w-4 mx-auto text-green-500 mb-1" />
              <p className="text-xs font-semibold text-gray-900">
                {data.batteryPercentage !== undefined ? `${data.batteryPercentage}%` : 'N/A'}
              </p>
              <p className="text-[10px] text-gray-500">Battery</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
              <Clock className="h-4 w-4 mx-auto text-red-500 mb-1" />
              <p className="text-xs font-semibold text-red-600">
                {data.safeForHours !== undefined ? `${data.safeForHours}h` : 'N/A'}
              </p>
              <p className="text-[10px] text-gray-500">Safe</p>
            </div>
          </div>

          {/* Quick Conditions */}
          {(data.hasFood || data.hasWater || data.hasChildren) && (
            <div className="flex flex-wrap gap-1.5">
              {data.hasFood && (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium">
                  ✓ Food
                </span>
              )}
              {!data.hasFood && type === 'sos' && (
                <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-medium">
                  ✗ Food
                </span>
              )}
              {data.hasWater && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                  ✓ Water
                </span>
              )}
              {!data.hasWater && type === 'sos' && (
                <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-medium">
                  ✗ Water
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleCall}
            disabled={!data.phoneNumber && !data.phone}
            className="flex flex-col items-center gap-1.5 py-3 px-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <Phone className="h-5 w-5" />
            <span className="text-xs font-semibold">Call</span>
          </button>
          <button
            onClick={handleDirections}
            className="flex flex-col items-center gap-1.5 py-3 px-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <Navigation className="h-5 w-5" />
            <span className="text-xs font-semibold">Nav</span>
          </button>
          <button
            onClick={() => setShowDetails(true)}
            className="flex flex-col items-center gap-1.5 py-3 px-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <Info className="h-5 w-5" />
            <span className="text-xs font-semibold">Details</span>
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && <DetailModal />}
    </>
  );
};
