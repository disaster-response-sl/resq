import { useState, useEffect } from 'react';
import { AlertCircle, Users, Search } from 'lucide-react';

export default function MissingPersonsDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for better UX
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Missing Persons System</h1>
            <p className="text-gray-600 mt-1">Feature currently unavailable - using production APIs only</p>
          </div>
        </div>

        {/* Empty State - Feature Not Available */}
        <div className="bg-white rounded-lg shadow-lg p-12">
          {loading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="text-center max-w-2xl mx-auto">
              <div className="mb-6">
                <AlertCircle className="h-24 w-24 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Missing Persons System Unavailable
                </h2>
                <p className="text-gray-600 mb-6">
                  This feature is currently unavailable as we are using only production-verified real-time APIs 
                  (DMC Flood Data API and Supabase Relief API) for this deployment.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Why is this unavailable?</h3>
                <ul className="text-left text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>This platform exclusively uses real, verified government data sources</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Missing persons data requires integration with official law enforcement databases</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Currently integrated: DMC Real-time Flood Alerts & Supabase Relief Coordination System</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Available Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-white p-4 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-gray-900">Relief Camps</h4>
                    <p className="text-sm text-gray-600">Real-time relief camp locations from Supabase</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <Search className="h-6 w-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-gray-900">Flood Monitoring</h4>
                    <p className="text-sm text-gray-600">Live flood data from 39 DMC gauging stations</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-500">
                <p>
                  For official missing persons reports, please contact:<br />
                  <strong>Police Emergency: 119</strong> | <strong>Disaster Management Centre: 117</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
