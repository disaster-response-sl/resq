import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import DashboardRouter from './components/DashboardRouter';
import SOSDashboard from './components/SOSDashboard';
import DisasterManagement from './components/DisasterManagement';
import DisasterHeatMap from './components/DisasterHeatMap';
import SOSHeatMap from './components/SOSHeatMapNew';
import ResourceManagement from './components/ResourceManagement';
import Settings from './components/Settings';
// Removed mock DPI integrations for production
// import NDXPage from './components/NDXPage';
import AnalyticsPage from './components/AnalyticsPage';
// Removed payment/donation features - focusing on disaster response
// import PaymentStatistics from './components/PaymentStatistics';
import MissingPersonsDashboard from './components/MissingPersonsDashboard';
import ReliefDataDashboard from './components/ReliefDataDashboard';
import ReportsDashboard from './components/ReportsDashboard';
import AdminIncidentReportsPage from './components/AdminIncidentReportsPage';
import CitizenDashboard from './components/CitizenDashboard';
import CitizenSOSPage from './components/CitizenSOSPage';
import CitizenReportPage from './components/CitizenReportPage';
import CitizenChatPage from './components/CitizenChatPage';
import CitizenMapPage from './components/CitizenMapPage';
import ReliefTrackerPage from './components/ReliefTrackerPage';
import EmergencyContactsPage from './components/EmergencyContactsPage';
import VolunteerFormPage from './components/VolunteerFormPage';
import LankaRouteWatchPage from './components/LankaRouteWatchPage';
import ReportRoadIssuePage from './components/ReportRoadIssuePage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sos" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SOSDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/disasters" 
                element={
                  <ProtectedRoute>
                    <DisasterManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/map" 
                element={<Navigate to="/map/disaster" replace />} 
              />
              <Route 
                path="/map/disaster" 
                element={
                  <ProtectedRoute>
                    <DisasterHeatMap />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/map/sos" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SOSHeatMap />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/resources" 
                element={
                  <ProtectedRoute>
                    <ResourceManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              {/* Payment routes removed - focusing on disaster response features */}
              {/* <Route path="/payments" element={<ProtectedRoute><PaymentStatistics /></ProtectedRoute>} /> */}
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              {/* NDX routes removed - mock DPI integration not needed for production */}
              {/* <Route path="/ndx" element={<ProtectedRoute><NDXPage /></ProtectedRoute>} /> */}
              <Route 
                path="/missing-persons" 
                element={
                  <ProtectedRoute>
                    <MissingPersonsDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/relief-data" 
                element={
                  <ProtectedRoute>
                    <ReliefDataDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <ReportsDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/incident-reports" 
                element={
                  <ProtectedRoute>
                    <AdminIncidentReportsPage />
                  </ProtectedRoute>
                } 
              />
              {/* Public Citizen Routes - No Authentication Required */}
              <Route path="/citizen" element={<CitizenDashboard />} />
              <Route path="/citizen/sos" element={<CitizenSOSPage />} />
              <Route path="/citizen/report" element={<CitizenReportPage />} />
              <Route path="/citizen/chat" element={<CitizenChatPage />} />
              <Route path="/citizen/map" element={<CitizenMapPage />} />
              <Route path="/citizen/relief-tracker" element={<ReliefTrackerPage />} />
              <Route path="/citizen/emergency-contacts" element={<EmergencyContactsPage />} />
              <Route path="/citizen/volunteer" element={<VolunteerFormPage />} />
              <Route path="/citizen/route-watch" element={<LankaRouteWatchPage />} />
              <Route path="/citizen/report-road" element={<ReportRoadIssuePage />} />
              
              {/* Redirect root to citizen dashboard */}
              <Route path="/" element={<Navigate to="/citizen" replace />} />
              <Route path="*" element={<Navigate to="/citizen" replace />} />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
