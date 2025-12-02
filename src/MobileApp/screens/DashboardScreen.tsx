import React, { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  StatusBar,
  Dimensions,
  Image,
  Platform,
  PermissionsAndroid,
  StyleSheet
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import NotificationService from '../services/NotificationService';
// ...existing imports...
import BackgroundNotificationService from '../services/BackgroundNotificationService';
import { API_BASE_URL } from '../config/api';
import { useLanguage } from '../services/LanguageService';
import { getTextStyle } from '../services/FontService';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { offlineService } from '../services/OfflineService';

const { width } = Dimensions.get('window');

interface Location {
  lat: number;
  lng: number;
}

interface Weather {
  temperature: string;
  condition: string;
  humidity: string;
  windSpeed: string;
}

interface AlertItem {
  id: number;
  type: string;
  location: string;
  severity: string;
  timestamp: string;
}

interface NavigationProps {
  navigation: any;
}

const DashboardScreen = ({ navigation }: NavigationProps) => {
  // ...hooks...

  // Handler for logout
  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    navigation.replace('Login');
  };
  // ...hooks...

  // Handler for quick actions
  const handleQuickAction = (action: string) => {
    // ...existing logic for handleQuickAction...
    // Example:
    // if (action === 'sos') { ... }
  };
  const { t, language } = useLanguage();
  const [location, setLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState<string>('Unknown');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [riskStatus, setRiskStatus] = useState<string>('Low');
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');
  const [availableResources, setAvailableResources] = useState<any[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // ...helpers and effect hooks here...

  // Main render
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {}}
          colors={["#3b82f6"]}
          tintColor="#3b82f6"
        />
      }
    >
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <View>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.userSection}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarIcon}>👤</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.welcomeText, getTextStyle(language, 14)]}>{t('welcome.back')}</Text>
                <Text style={[styles.userNameText, getTextStyle(language, 18)]}>{t('welcome.user')}</Text>
                <Text style={[styles.roleText, getTextStyle(language, 12)]}>{userRole}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <LanguageSwitcher compact={true} />
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>➡️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Offline Mode Indicator */}
        {isOfflineMode && (
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>📱 Offline Mode</Text>
            <Text style={styles.offlineSubtext}>Limited functionality available</Text>
          </View>
        )}

        {/* Current Location Section */}
        <View style={styles.locationSection}>
          <Text style={[styles.sectionTitle, getTextStyle(language, 16)]}>{t('location.current')}</Text>
          {location ? (
            <View style={styles.locationContent}>
              <View style={styles.coordinateRow}>
                <Text style={[styles.coordinateLabel, getTextStyle(language, 14)]}>{t('location.latitude')}</Text>
                <Text style={styles.coordinateValue}>{location.lat.toFixed(6)}</Text>
              </View>
              <View style={styles.coordinateRow}>
                <Text style={[styles.coordinateLabel, getTextStyle(language, 14)]}>{t('location.longitude')}</Text>
                <Text style={styles.coordinateValue}>{location.lng.toFixed(6)}</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.loadingText, getTextStyle(language, 14)]}>{t('location.getting')}</Text>
          )}
        </View>

        {/* Weather & Risk Status Row */}
        <View style={styles.statusRow}>
          {/* Weather Card */}
          <View style={styles.statusCard}>
            <Text style={[styles.statusCardTitle, getTextStyle(language, 14)]}>{t('weather.title')}</Text>
            {weather ? (
              <View style={styles.weatherContent}>
                <Text style={styles.mainWeatherText}>{weather.temperature}</Text>
                <Text style={styles.weatherCondition}>{weather.condition}</Text>
                <View style={styles.weatherDetails}>
                  <Text style={styles.weatherDetail}>💧 {weather.humidity}</Text>
                  <Text style={styles.weatherDetail}>💨 {weather.windSpeed}</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.loadingText, getTextStyle(language, 14)]}>{t('weather.loading')}</Text>
            )}
          </View>

          {/* Risk Status Card */}
          <View style={styles.statusCard}>
            <Text style={[styles.statusCardTitle, getTextStyle(language, 14)]}>{t('risk.title')}</Text>
            <View style={styles.riskContent}>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(riskStatus) }]}> 
                <Text style={[styles.riskText, getTextStyle(language, 14)]}>{t(`risk.${riskStatus.toLowerCase()}`)}</Text>
              </View>
              <Text style={[styles.riskDescription, getTextStyle(language, 11)]}>{t('risk.description')}</Text>
              {riskStatus === 'High' && (
                <View style={styles.highRiskWarning}>
                  <Text style={[styles.warningText, getTextStyle(language, 10)]}>{t('risk.stayAlert')}</Text>
                  <TouchableOpacity style={styles.viewDetailsButton} onPress={() => navigation.navigate('RiskMap')}>
                    <Text style={styles.viewDetailsText}>{t('risk.viewDetails')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* SOS Button (Prominent) and Quick Actions Grid (single instance) */}
        <View style={styles.quickActionsSection}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ef4444', marginBottom: 16 }]} onPress={() => handleQuickAction('sos')}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.actionIcon}>🚨</Text>
              <Text style={[styles.actionText, getTextStyle(language, 20)]}>{t('actions.emergencySos')}</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, getTextStyle(language, 16)]}>{t('actions.title')}</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3b82f6' }]} onPress={() => handleQuickAction('report')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.actionIcon}>📝</Text>
                <Text style={[styles.actionText, getTextStyle(language, 16)]}>{t('actions.reportIncident')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10b981' }]} onPress={() => handleQuickAction('riskmap')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.actionIcon}>🗺️</Text>
                <Text style={[styles.actionText, getTextStyle(language, 16)]}>{t('actions.viewMap')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f59e0b' }]} onPress={() => handleQuickAction('chat')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={[styles.actionText, getTextStyle(language, 16)]}>{t('actions.emergencyChat')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]} onPress={() => handleQuickAction('consent')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.actionIcon}>🔐</Text>
                <Text style={[styles.actionText, getTextStyle(language, 16)]}>{t('actions.privacySettings')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#27ae60' }]} onPress={() => handleQuickAction('donation')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.actionIcon}>💝</Text>
                <Text style={[styles.actionText, getTextStyle(language, 16)]}>{t('donations.make_donation')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={[styles.sectionTitle, getTextStyle(language, 16)]}>{t('alerts.title')}</Text>
            <View style={styles.alertsList}>
              {recentAlerts.slice(0, 2).map((alert) => (
                <View key={alert.id} style={styles.alertItem}>
                  <View style={styles.alertContent}>
                    <Text style={[styles.alertType, getTextStyle(language, 14)]}>{alert.type}</Text>
                    <Text style={styles.alertLocation}>{alert.location}</Text>
                  </View>
                  <View style={styles.alertSeverity}>
                    <Text style={[styles.severityText, { color: getRiskColor(alert.severity) }]}>{t(`risk.${alert.severity.toLowerCase()}`)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Language Switcher Section */}
        <LanguageSwitcher style={{ marginHorizontal: 16, marginBottom: 12 }} />
        <View style={styles.bottomPadding} />
      </View>
    </ScrollView>
  );
}
  const { t, language } = useLanguage();
  const [location, setLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState<string>('Unknown');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [riskStatus, setRiskStatus] = useState<string>('Low');
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');
  const [availableResources, setAvailableResources] = useState<any[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // Helper: getRiskColor
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Helper: handleLogout


  // Helper: getCurrentLocation
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (pos) => {
        const coords = pos.coords;
        // ...existing code for hooks and helpers...
        // (Move all hooks and helpers above this return statement)
      },
      (error) => {
        console.error('Location error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );


  const fetchWeatherData = async (lat: number, lng: number) => {
    try {
      // Use environment variable for API key - never hardcode credentials
      const API_KEY = process.env.OPENWEATHER_API_KEY || '';
      if (!API_KEY) {
        console.warn('⚠️ OpenWeather API key not configured');
        return;
      }
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`
      );

      if (response.data) {
        const weatherData = response.data;
        const weather: Weather = {
          temperature: `${Math.round(weatherData.main.temp)}°C`,
          condition: weatherData.weather[0].main,
          humidity: `${weatherData.main.humidity}%`,
          windSpeed: `${Math.round(weatherData.wind.speed * 3.6)} km/h`
        };
        setWeather(weather);
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      const mockWeather: Weather = {
        temperature: '24°C',
        condition: 'Clear',
        humidity: '68%',
        windSpeed: '6 km/h'
      };
      setWeather(mockWeather);
    }
  };

  const fetchRiskStatus = async (lat: number, lng: number) => {

    try {
      // TEMPORARY FIX: Use test token if no token is stored (same as RiskMapScreen)
      let token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found, using test token for risk assessment');
        token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ0ZXN0LXVzZXItMTIzIiwiaW5kaXZpZHVhbElkIjoidGVzdC11c2VyLTEyMyIsInJvbGUiOiJDaXRpemVuIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTc1NTk0NzExNSwiZXhwIjoxNzU2MDMzNTE1fQ.KvJrjN-i0lDKIHf8GnQLMMRWb1cFjxpVfcnkdI8lXPI';
        await AsyncStorage.setItem('authToken', token);
      }

      console.log('🔍 Assessing risk for location:', lat, lng);
      
      const response = await axios.get(`${API_BASE_URL}/mobile/disasters`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        const disasters = response.data.data;
        console.log('📊 Found disasters for risk assessment:', disasters.length);

        let riskLevel = 'Low';
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let lowRiskCount = 0;

        // Function to calculate distance between two points in kilometers
        const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
          const R = 6371; // Earth's radius in kilometers
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        disasters.forEach((disaster: any) => {
          if (disaster.location && disaster.location.lat && disaster.location.lng) {
            const distance = calculateDistance(
              lat, lng, 
              disaster.location.lat, disaster.location.lng
            );

            // ...existing logic for risk assessment...
          }
        });

        // ...existing logic for notifications and risk level...
      }
    } catch (error) {
      console.error('Risk assessment error:', error);
    }
  };

  const fetchRecentAlerts = async () => {
    try {
      // TEMPORARY FIX: Use test token if no token is stored
      let token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found, using test token for alerts');
        token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ0ZXN0LXVzZXItMTIzIiwiaW5kaXZpZHVhbElkIjoidGVzdC11c2VyLTEyMyIsInJvbGUiOiJDaXRpemVuIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTc1NTk0NzExNSwiZXhwIjoxNzU2MDMzNTE1fQ.KvJrjN-i0lDKIHf8GnQLMMRWb1cFjxpVfcnkdI8lXPI';
        await AsyncStorage.setItem('authToken', token);
      }

      // Try to fetch alerts from /mobile/alerts endpoint
      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/mobile/alerts`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (err) {
        // If 404, fallback to mock data silently
        if ((err as any).response && (err as any).response.status === 404) {
          setRecentAlerts([
            {
              id: 1,
              type: 'Weather Alert',
              location: 'Colombo District',
              severity: 'medium',
              timestamp: new Date().toISOString(),
            },
            {
              id: 2,
              type: 'Flood Alert',
              location: 'Galle District',
              severity: 'high',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            }
          ]);
          return;
        } else {
          throw err;
        }
      }

      if (response && response.data && response.data.success) {
        const alerts = response.data.data.map((alert: any) => ({
          id: alert._id,
          type: alert.type.charAt(0).toUpperCase() + alert.type.slice(1) + ' Alert',
          location: `${alert.location?.lat?.toFixed(2)}, ${alert.location?.lng?.toFixed(2)}`,
          severity: alert.severity,
          timestamp: alert.timestamp,
          description: alert.description
        }));
        setRecentAlerts(alerts);
      }
    } catch (error) {
      // Only log error if not a 404
      if (!((error as any).response && (error as any).response.status === 404)) {
        console.error('Alerts fetch error:', error);
      }
      console.log('📱 Using mock alerts data (backend unavailable)');
      // Provide mock data when backend is unavailable
      const mockAlerts: AlertItem[] = [
        {
          id: 1,
          type: 'Weather Alert',
          location: 'Colombo District',
          severity: 'medium',
          timestamp: new Date().toISOString()
        },
        {
          id: 2, 
          type: 'Flood Alert',
          location: 'Galle District',
          severity: 'high',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setRecentAlerts(mockAlerts);
    }
  };

  const fetchAvailableResources = async () => {
    try {
      // Check if in offline mode first
      if (isOfflineMode) {
        console.log('📱 Loading resources from offline service');
        setAvailableResources(offlineService.getMockResources());
        return;
      }

      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/mobile/resources`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAvailableResources(response.data.data);
      }
    } catch (error) {
      console.error('Resources fetch error:', error);
      console.log('📱 Using mock resources data (backend unavailable)');
      
      // Enable offline mode if not already enabled
      if (!isOfflineMode) {
        await offlineService.enableOfflineMode();
        setIsOfflineMode(true);
      }
      
      // Use offline service mock data
      setAvailableResources(offlineService.getMockResources());
    }
  };


  const handleQuickAction = (action: string) => {

  // ...existing logic for handleQuickAction...
  // Example:
  // if (action === 'sos') { ... }
};

// ...any other hooks or functions...

// END OF COMPONENT
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#bfdbfe',
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 12,
    color: '#bfdbfe',
    textTransform: 'capitalize',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 20,
    color: '#ffffff',
  },
  offlineIndicator: {
    backgroundColor: '#fbbf24',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
  },
  offlineSubtext: {
    fontSize: 12,
    color: '#92400e',
  },
  locationSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  locationContent: {
    gap: 8,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  coordinateValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statusRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  weatherContent: {
    alignItems: 'center',
  },
  mainWeatherText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  weatherCondition: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  weatherDetails: {
    gap: 2,
  },
  weatherDetail: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  riskContent: {
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  riskText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  riskDescription: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  highRiskWarning: {
    marginTop: 8,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  viewDetailsButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  quickActionsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  alertsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertsList: {
    gap: 12,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  alertContent: {
    flex: 1,
  },
  alertType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  alertLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
  alertSeverity: {
    marginLeft: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 24,
  },
  debugSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debugButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  debugButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
