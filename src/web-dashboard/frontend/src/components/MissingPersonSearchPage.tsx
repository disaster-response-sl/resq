import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Phone, Calendar, AlertCircle, Filter, Loader2, ArrowLeft, ExternalLink, AlertTriangle, Flag, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { searchMissingPersons, getAllMissingPersons, reportSpam } from '../services/missingPersonService';
import { MissingPerson, SearchParams } from '../types/missingPerson';

const MissingPersonSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<SearchParams>({
    status: 'missing',
    priority: '',
    disaster_related: undefined,
    radius_km: 100
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<MissingPerson | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  // Load missing persons
  useEffect(() => {
    loadMissingPersons();
  }, [filters]);

  const loadMissingPersons = async () => {
    setLoading(true);
    try {
      const searchParams: SearchParams = {
        ...filters,
        q: searchQuery || undefined,
        lat: userLocation?.lat,
        lng: userLocation?.lng
      };

      const response = searchQuery || userLocation
        ? await searchMissingPersons(searchParams)
        : await getAllMissingPersons(filters);

      // Show all reports (backend filters out rejected and auto_hidden)
      setMissingPersons(response.data);
    } catch (error: any) {
      console.error('Error loading missing persons:', error);
      toast.error('Failed to load missing persons');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMissingPersons();
  };

  const handleReportSpam = async (personId: string) => {
    const reason = prompt('Why are you reporting this as spam or fake?');
    if (!reason) return;

    try {
      const userId = localStorage.getItem('userId') || `anon_${Date.now()}`;
      const response = await reportSpam(personId, {
        reason,
        reported_by: userId
      });

      if (response.auto_hidden) {
        toast.success('Report flagged as spam and auto-hidden for review');
        loadMissingPersons(); // Refresh list
      } else {
        toast.success(`Spam reported (${response.spam_count}/3 reports). Will be auto-hidden at 3 reports.`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to report spam');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Missing Persons</h1>
                <p className="text-sm text-gray-600">Help us find them</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/missing-persons/report')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Report Missing Person
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, case number, or location..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All</option>
                    <option value="missing">Missing</option>
                    <option value="sighting_reported">Sighting Reported</option>
                    <option value="investigation_ongoing">Investigation Ongoing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={filters.priority || ''}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Radius (km)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    step="10"
                    value={filters.radius_km || 100}
                    onChange={(e) => setFilters({ ...filters, radius_km: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : missingPersons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <p className="text-sm text-gray-600">
                <strong>{missingPersons.length}</strong> missing person{missingPersons.length !== 1 ? 's' : ''} found
                {userLocation && ' (sorted by distance from you)'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missingPersons.map((person) => (
                <div
                  key={person._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedPerson(person)}
                >
                  {person.photo_urls.length > 0 && (
                    <img
                      src={person.photo_urls[0]}
                      alt={person.full_name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{person.full_name}</h3>
                        <p className="text-sm text-gray-500">Case: {person.case_number}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          person.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          person.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          person.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {person.priority.toUpperCase()}
                        </span>
                        {person.verification_status === 'verified' ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Age: {person.age || 'Unknown'}, {person.gender}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{person.last_seen_location.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Last seen: {new Date(person.last_seen_date).toLocaleDateString()}</span>
                      </div>
                      {person.distance_km && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{person.distance_km.toFixed(1)} km from you</span>
                        </div>
                      )}
                    </div>

                    {person.is_vulnerable && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mb-4">
                        <p className="text-xs text-red-700 font-medium">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Vulnerable Person
                        </p>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPerson(person);
                      }}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Detail Modal */}
        {selectedPerson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedPerson.full_name}</h2>
                      <p className="text-sm text-gray-500">Case: {selectedPerson.case_number}</p>
                    </div>
                    {selectedPerson.verification_status === 'verified' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Officially Verified
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        User Reported - Not Verified
                      </span>
                    )}
                  </div>
                  {selectedPerson.verification_status === 'unverified' && (
                    <button
                      onClick={() => handleReportSpam(selectedPerson._id)}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Flag className="w-3 h-3" />
                      Report as Spam/Fake
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="text-gray-400 hover:text-gray-600 ml-4"
                >
                  ✕
                </button>
              </div>

              {selectedPerson.photo_urls.length > 0 && (
                <img
                  src={selectedPerson.photo_urls[0]}
                  alt={selectedPerson.full_name}
                  className="w-full rounded-lg shadow-md mb-4"
                />
              )}

              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedPerson.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Last Seen</h3>
                  <p className="text-gray-700">
                    <strong>Date:</strong> {new Date(selectedPerson.last_seen_date).toLocaleString()}<br />
                    <strong>Location:</strong> {selectedPerson.last_seen_location.address}<br />
                    <strong>Circumstances:</strong> {selectedPerson.circumstances}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-900">
                      <strong>If you have any information, please contact:</strong><br />
                      <Phone className="w-4 h-4 inline mr-1" />
                      {selectedPerson.reporter_phone} ({selectedPerson.reporter_name} - {selectedPerson.reporter_relationship})
                    </p>
                  </div>
                </div>

                {selectedPerson.is_vulnerable && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Vulnerable Person
                    </h3>
                    {selectedPerson.medical_conditions && (
                      <p className="text-sm text-red-800 mb-1">
                        <strong>Medical Conditions:</strong> {selectedPerson.medical_conditions}
                      </p>
                    )}
                    {selectedPerson.medication_required && (
                      <p className="text-sm text-red-800">
                        <strong>Medication Required:</strong> {selectedPerson.medication_required}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <button
                    onClick={() => setSelectedPerson(null)}
                    className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissingPersonSearchPage;
