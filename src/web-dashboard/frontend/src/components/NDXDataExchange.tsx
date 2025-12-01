import React, { useState, useEffect } from 'react';
import { ndxService } from '../services/ndxService';
import { Database, Download, MapPin, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExchangeRequest {
  consentId: string;
  dataProvider: string;
  dataType: string;
  purpose: string;
}

interface Consent {
  _id: string;
  consentId: string;
  dataProvider: string;
  dataType: string;
  purpose: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  requester: string;
}

interface DisasterData {
  _id: string;
  type: string;
  severity: string;
  description: string;
  location?: { lat: number; lng: number };
  timestamp: string;
}

interface ExchangeResult {
  success: boolean;
  data: DisasterData[];
  consentId: string;
  message: string;
}

const NDXDataExchange: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [consentsLoading, setConsentsLoading] = useState(true);
  const [exchangeData, setExchangeData] = useState<DisasterData[]>([]);
  const [lastExchange, setLastExchange] = useState<string | null>(null);
  const [approvedConsents, setApprovedConsents] = useState<Consent[]>([]);
  const [selectedConsentId, setSelectedConsentId] = useState<string>('');
  const [exchangeRequest, setExchangeRequest] = useState<ExchangeRequest>({
    consentId: '',
    dataProvider: 'disaster-management',
    dataType: 'disasters',
    purpose: 'exchange-test'
  });

  // Fetch approved consents on component mount
  useEffect(() => {
    const fetchApprovedConsents = async () => {
      try {
        const response = await ndxService.getConsents();
        if (response.success && response.consents) {
          const approved = response.consents.filter((consent: Consent) => consent.status === 'APPROVED');
          setApprovedConsents(approved);
        }
      } catch (error) {
        console.error('Error fetching consents:', error);
        toast.error('Failed to load approved consents');
      } finally {
        setConsentsLoading(false);
      }
    };

    fetchApprovedConsents();
  }, []); // Remove selectedConsentId from dependencies to avoid infinite loop

  // Handle consent selection
  const handleConsentSelect = (consentId: string) => {
    setSelectedConsentId(consentId);
    const selectedConsent = approvedConsents.find(consent => consent.consentId === consentId);
    if (selectedConsent) {
      setExchangeRequest({
        consentId: selectedConsent.consentId,
        dataProvider: selectedConsent.dataProvider,
        dataType: selectedConsent.dataType,
        purpose: selectedConsent.purpose
      });
    } else {
      // Clear selection if no consent found
      setSelectedConsentId('');
      setExchangeRequest(prev => ({ ...prev, consentId: '' }));
    }
  };

  const handleDataExchange = async () => {
    if (!exchangeRequest.consentId.trim()) {
      toast.error('Please select an approved consent or enter a consent ID manually');
      return;
    }

    setLoading(true);
    try {
      const response: ExchangeResult = await ndxService.exchangeData(exchangeRequest);
      if (response.success) {
        setExchangeData(response.data);
        setLastExchange(new Date().toLocaleString());
        toast.success(`Data exchange successful! Retrieved ${response.data.length} records`);
      } else {
        toast.error('Data exchange failed');
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error during data exchange';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'flood': return '🌊';
      case 'earthquake': return '🏔️';
      case 'fire': return '🔥';
      case 'storm': return '⛈️';
      case 'drought': return '🏜️';
      case 'heavy-rain': return '🌧️';
      case 'wind': return '💨';
      case 'landslide': return '🏔️';
      default: return '⚠️';
    }
  };

  const getProviderDisplayName = (provider: string) => {
    const providerNames: { [key: string]: string } = {
      'disaster-management': 'Disaster Management Authority',
      'weather-service': 'Meteorological Department',
      'health-ministry': 'Ministry of Health',
      'transport-ministry': 'Ministry of Transport'
    };
    return providerNames[provider] || provider;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  return (
    <div className="p-6">
    <div className="flex items-center gap-2 mb-6">
      <Database className="w-6 h-6 text-indigo-600" />
      <h2 className="text-xl font-semibold text-gray-800">NDX Data Exchange</h2>
    </div>

      {/* Exchange Form */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Data Exchange Request</h3>

        {/* Consent Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Approved Consent</label>
          {consentsLoading ? (
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-300 rounded-md">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-gray-600">Loading approved consents...</span>
            </div>
          ) : approvedConsents.length === 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">No approved consents found. Please request and approve consents first.</span>
              </div>
            </div>
          ) : (
            <select
              value={selectedConsentId}
              onChange={(e) => handleConsentSelect(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md bg-white"
            >
              <option value="">-- Select an approved consent --</option>
              {approvedConsents.map((consent) => (
                <option key={consent.consentId} value={consent.consentId}>
                  {consent.consentId} - {getProviderDisplayName(consent.dataProvider)} ({consent.dataType})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Consent Details */}
        {selectedConsentId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Selected Consent Details:</h4>
            {(() => {
              const selectedConsent = approvedConsents.find(c => c.consentId === selectedConsentId);
              if (!selectedConsent) return null;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Provider:</span>
                    <span className="ml-2 text-blue-600">{getProviderDisplayName(selectedConsent.dataProvider)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Data Type:</span>
                    <span className="ml-2 text-blue-600 capitalize">{selectedConsent.dataType.replace('-', ' ')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Purpose:</span>
                    <span className="ml-2 text-blue-600 capitalize">{selectedConsent.purpose.replace('-', ' ')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Expires:</span>
                    <span className={`ml-2 ${isExpired(selectedConsent.expiresAt) ? 'text-red-600' : 'text-green-600'}`}>
                      {formatDate(selectedConsent.expiresAt)}
                      {isExpired(selectedConsent.expiresAt) && ' (Expired)'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Manual Consent ID Input (fallback) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Or Enter Consent ID Manually
            {selectedConsentId && <span className="text-xs text-gray-500 ml-2">(Will override dropdown selection)</span>}
          </label>
          <input
            type="text"
            value={exchangeRequest.consentId}
            onChange={(e) => {
              setExchangeRequest(prev => ({ ...prev, consentId: e.target.value }));
              // Clear dropdown selection when user types manually
              if (selectedConsentId) {
                setSelectedConsentId('');
              }
            }}
            placeholder="Enter approved consent ID"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Provider</label>
            <select
              value={exchangeRequest.dataProvider}
              onChange={(e) => {
                setExchangeRequest(prev => ({ ...prev, dataProvider: e.target.value }));
                // Clear dropdown selection if user manually changes provider
                if (selectedConsentId) {
                  setSelectedConsentId('');
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="disaster-management">Disaster Management Authority</option>
              <option value="weather-service">Meteorological Department</option>
              <option value="health-ministry">Ministry of Health</option>
              <option value="transport-ministry">Ministry of Transport</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
            <select
              value={exchangeRequest.dataType}
              onChange={(e) => {
                setExchangeRequest(prev => ({ ...prev, dataType: e.target.value }));
                // Clear dropdown selection if user manually changes data type
                if (selectedConsentId) {
                  setSelectedConsentId('');
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="disasters">Disasters</option>
              <option value="weather-alerts">Weather Alerts</option>
              <option value="resources">Resources</option>
              <option value="medical-supplies">Medical Supplies</option>
              <option value="road-conditions">Road Conditions</option>
              <option value="evacuation-routes">Evacuation Routes</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDataExchange}
            disabled={loading || !exchangeRequest.consentId.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Exchanging...' : 'Exchange Data'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Exchange Results</h3>
          {lastExchange && (
            <span className="text-sm text-gray-500">Last updated: {lastExchange}</span>
          )}
        </div>
        
        {exchangeData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No data exchanged yet. Select an approved consent and use the form above to request data.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Found {exchangeData.length} record(s)
            </div>
            
            {exchangeData.map((item) => (
              <div key={item._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(item.type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-800 capitalize">{item.type.replace('-', ' ')}</h4>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(item.severity)}`}>
                        {item.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">{item.description}</p>
                
                {item.location && item.location.lat !== undefined && item.location.lng !== undefined ? (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>Lat: {item.location.lat.toFixed(4)}, Lng: {item.location.lng.toFixed(4)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>Location not available</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NDXDataExchange;
