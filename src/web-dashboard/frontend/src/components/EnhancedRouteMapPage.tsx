import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Navigation, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
const createStartIcon = () => {
  return L.divIcon({
    html: `
      <div style="background: #10b981; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 24px;">🚗</span>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const createEndIcon = () => {
  return L.divIcon({
    html: `
      <div style="background: #3b82f6; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 24px;">🎯</span>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const createDangerIcon = (severity: string) => {
  const colors: any = {
    critical: '#dc2626',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6'
  };
  
  const emoji: any = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: 'ℹ️'
  };
  
  const color = colors[severity] || '#6b7280';
  const icon = emoji[severity] || '⚠️';
  
  return L.divIcon({
    html: `
      <div style="background: ${color}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
        <span style="font-size: 18px;">${icon}</span>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Component to fit map bounds
const FitBounds: React.FC<{ bounds: L.LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  
  return null;
};

interface RouteMapViewProps {}

const EnhancedRouteMapPage: React.FC<RouteMapViewProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef<L.Map>(null);
  
  // Get route data from navigation state
  const { fromCoords, toCoords, fromLocation, toLocation, route, safetyAnalysis } = location.state || {};
  
  const [mapCenter] = useState<[number, number]>(
    fromCoords || [7.8731, 80.7718] // Sri Lanka center as fallback
  );
  const [showDangerZones, setShowDangerZones] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  
  useEffect(() => {
    if (!fromCoords || !toCoords || !route) {
      toast.error('No route data available. Please plan a route first.');
      navigate('/citizen/safe-routes');
    }
  }, [fromCoords, toCoords, route, navigate]);
  
  if (!fromCoords || !toCoords || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }
  
  // Calculate bounds for the map
  const bounds: [number, number][] = [
    fromCoords,
    toCoords,
    ...route.map((coord: [number, number]) => coord)
  ];
  
  // Get danger zone color based on severity
  const getDangerZoneColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/citizen/safe-routes')}
                className="flex items-center text-white hover:text-blue-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </button>
              <div className="border-l border-white/30 pl-4">
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Navigation className="h-6 w-6" />
                  Interactive Route Map
                </h1>
                <p className="text-blue-100 text-sm">
                  {fromLocation} → {toLocation}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {safetyAnalysis && (
                <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
                  safetyAnalysis.isSafe 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {safetyAnalysis.isSafe ? '✅ SAFE' : `⚠️ ${safetyAnalysis.intersections.length} HAZARDS`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="bg-white border-b shadow-sm p-3 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showRoute}
                onChange={(e) => setShowRoute(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Route</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDangerZones}
                onChange={(e) => setShowDangerZones(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Danger Zones</span>
            </label>
          </div>
          
          <div className="flex items-center gap-4">
            {safetyAnalysis && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-bold text-gray-900">{safetyAnalysis.totalDistance.toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-bold text-gray-900">~{Math.round(safetyAnalysis.estimatedDuration)} min</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Fit bounds to show entire route */}
          <FitBounds bounds={bounds as L.LatLngBoundsExpression} />
          
          {/* Start Marker */}
          <Marker position={fromCoords} icon={createStartIcon()}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-green-700 mb-1">🚗 Starting Point</h3>
                <p className="text-sm text-gray-700">{fromLocation}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {fromCoords[0].toFixed(5)}, {fromCoords[1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
          
          {/* End Marker */}
          <Marker position={toCoords} icon={createEndIcon()}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-blue-700 mb-1">🎯 Destination</h3>
                <p className="text-sm text-gray-700">{toLocation}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {toCoords[0].toFixed(5)}, {toCoords[1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
          
          {/* Route Line */}
          {showRoute && route && (
            <Polyline
              positions={route}
              color="#3b82f6"
              weight={5}
              opacity={0.7}
              dashArray="10, 10"
            />
          )}
          
          {/* Danger Zones */}
          {showDangerZones && safetyAnalysis && safetyAnalysis.intersections.map((intersection: any) => {
            const zone = intersection.zone;
            return (
              <React.Fragment key={zone.id}>
                {/* Danger Zone Circle */}
                <Circle
                  center={zone.location}
                  radius={zone.radius * 1000} // Convert km to meters
                  pathOptions={{
                    color: getDangerZoneColor(zone.severity),
                    fillColor: getDangerZoneColor(zone.severity),
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />
                
                {/* Danger Zone Marker */}
                <Marker position={zone.location} icon={createDangerIcon(zone.severity)}>
                  <Popup>
                    <div className="p-3 min-w-[250px]">
                      <div className="flex items-start gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          zone.severity === 'critical' ? 'bg-red-600 text-white' :
                          zone.severity === 'high' ? 'bg-orange-600 text-white' :
                          zone.severity === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {zone.severity.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-800">
                          {zone.condition.toUpperCase()}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-2">
                        {zone.road_name || 'Road Hazard'}
                      </h3>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {zone.description}
                      </p>
                      
                      <div className="border-t pt-2 mt-2 space-y-1">
                        {zone.district && (
                          <p className="text-xs text-gray-600">📍 District: {zone.district}</p>
                        )}
                        <p className="text-xs text-gray-600">
                          📏 Danger radius: {zone.radius} km
                        </p>
                        <p className="text-xs text-gray-600">
                          🛣️ Distance from route: {intersection.distanceKm.toFixed(2)} km
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {zone.location[0].toFixed(5)}, {zone.location[1].toFixed(5)}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
        
        {/* Legend */}
        <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-xl p-4 z-[1000] max-w-xs">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Map Legend
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚗</span>
              <span className="text-gray-700">Starting Point</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span className="text-gray-700">Destination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-blue-500" style={{ borderStyle: 'dashed' }}></div>
              <span className="text-gray-700">Your Route</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <p className="font-semibold text-gray-900 mb-1">Hazard Severity:</p>
              <div className="space-y-1 ml-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚨</span>
                  <span className="text-red-700 font-medium">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span className="text-orange-700 font-medium">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="text-yellow-700 font-medium">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">ℹ️</span>
                  <span className="text-blue-700 font-medium">Low</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      {safetyAnalysis && (
        <div className={`border-t shadow-lg z-10 ${
          safetyAnalysis.isSafe ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {safetyAnalysis.isSafe ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-green-800 font-semibold">
                      ✅ Safe route - No hazards detected
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <p className="text-red-800 font-semibold">
                      ⚠️ {safetyAnalysis.intersections.length} hazard(s) near your route - Exercise caution
                    </p>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => navigate('/citizen/safe-routes')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Plan Another Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRouteMapPage;
