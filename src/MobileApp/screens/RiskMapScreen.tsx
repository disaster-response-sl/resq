// components/RiskMapScreen.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
  PermissionsAndroid,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';
// Leaflet via Web View
import LeafletMap, { LeafletDisasterPoint } from '../components/LeafletMap';
import NDXService from '../services/NDXService';
import { API_BASE_URL } from '../config/api';
import { useLanguage } from '../services/LanguageService';
import { getTextStyle } from '../services/FontService';
import { offlineService } from '../services/OfflineService';

const { width, height } = Dimensions.get('window');

interface Disaster {
  _id: string;
  type: 'flood' | 'landslide' | 'cyclone';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  status: 'active' | 'resolved';
}

interface RiskMapScreenProps {
  navigation: any;
}

const RiskMapScreen: React.FC<RiskMapScreenProps> = ({ navigation }) => {
  const { t, language } = useLanguage();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [showAllDisasters, setShowAllDisasters] = useState(true);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  };

  const fetchDisasters = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      // Require proper authentication
      if (!token) {
        Alert.alert('Authentication Required', 'Please log in to view disaster information.');
        return;
      }

      // NDX service disabled for performance
      const useNDX = false;
      if (useNDX) {
        try {
          const userLocationForNDX = userLocation 
            ? { lat: userLocation.latitude, lng: userLocation.longitude }
            : { lat: 6.9271, lng: 79.8612 };
          
          const ndxResult = await NDXService.getDisasterInfo(userLocationForNDX);
          if (ndxResult.success && ndxResult.data) {
            setDisasters(ndxResult.data);
            setOfflineMode(false);
            return;
          }
        } catch (ndxError) {
          console.log('NDX not available, falling back to direct API');
        }
      }

      // Direct API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await axios.get(`${API_BASE_URL}/mobile/disasters`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const fetchedDisasters = response.data?.data || [];
      setDisasters(fetchedDisasters);

      // Cache disasters for offline use
      await AsyncStorage.setItem('cachedDisasters', JSON.stringify(fetchedDisasters));
      await AsyncStorage.setItem('disastersCacheTime', new Date().toISOString());

      setOfflineMode(false);
    } catch (error: any) {
      console.error('Error fetching disasters:', error);

      if (error?.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please log in again');
      } else {
        await loadCachedDisasters();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCachedDisasters = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cachedDisasters');
      const cacheTime = await AsyncStorage.getItem('disastersCacheTime');

      if (cachedData && cacheTime) {
        const parsedDisasters = JSON.parse(cachedData);
        const cacheAge = new Date().getTime() - new Date(cacheTime).getTime();
        const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge < maxCacheAge) {
          setDisasters(parsedDisasters);
          setOfflineMode(true);
          Alert.alert(t('riskMap.offlineTitle'), t('riskMap.offlineMessage'));
        } else {
          await AsyncStorage.removeItem('cachedDisasters');
          await AsyncStorage.removeItem('disastersCacheTime');
          Alert.alert(t('riskMap.cacheExpiredTitle'), t('riskMap.cacheExpiredMessage'));
        }
      } else {
        Alert.alert(t('riskMap.noCacheTitle'), t('riskMap.noCacheMessage'));
      }
    } catch (error) {
      console.error('Error loading cached disasters:', error);
      Alert.alert(t('riskMap.cacheErrorTitle'), t('riskMap.cacheErrorMessage'));
    }
  };

  // Function to clear all cached data
  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem('cachedDisasters');
      await AsyncStorage.removeItem('disastersCacheTime');
      console.log('🧹 Cache cleared successfully');
      Alert.alert('Cache Cleared', 'All cached disaster data has been removed.');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  // Function to test API connection
  const testAPIConnection = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/mobile/disasters`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000 // Add timeout for faster feedback
      });

      Alert.alert(t('debug.apiTestTitle'), t('debug.apiTestSuccess', { count: response.data?.data?.length || 0 }));
    } catch (error: any) {
      console.error('API Test Failed:', error);
      Alert.alert(t('debug.apiTestFailedTitle'), error.message || t('debug.apiTestFailedMessage'));
    }
  };

  const getDisasterIcon = (type: string) => {
    switch (type) {
      case 'flood':
        return '🌊';
      case 'landslide':
        return '⛰️';
      case 'cyclone':
        return '🌀';
      default:
        return '⚠️';
    }
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs}h ago`;
    } else {
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays}d ago`;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDisasters();
  };

  useEffect(() => {
    // Start with cached data immediately to show something fast
    const loadCachedFirst = async () => {
      const cachedData = await AsyncStorage.getItem('cachedDisasters');
      if (cachedData) {
        try {
          const parsedDisasters = JSON.parse(cachedData);
          setDisasters(parsedDisasters);
          setLoading(false); // Show cached data while fetching fresh data
        } catch (error) {
          console.error('Error parsing cached data:', error);
        }
      }
    };

    loadCachedFirst();
    
    // Fetch fresh data in the background
    fetchDisasters();

    // Get location with shorter timeout for better performance
    (async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        Geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            console.log('📍 GPS location found for risk map:', latitude, longitude);
            setUserLocation({ latitude, longitude });
          },
          (err) => {
            console.warn('Geolocation error:', err?.message || err);
            // Use default Colombo location when GPS fails
            const defaultLocation = { latitude: 6.9271, longitude: 79.8612 };
            setUserLocation(defaultLocation);
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 } // Reduced timeout to 5s, cache for 5 minutes
        );
      } else {
        // If no permission, use default location
        setUserLocation({ latitude: 6.9271, longitude: 79.8612 });
      }
    })();
  }, []);

  const recenterMap = () => {
    setRefreshFlag((flag) => flag + 1);
  };

  // Memoize filtered disasters to prevent unnecessary recalculations
  const filteredDisasters = useMemo(() => {
    let filtered = disasters;

    if (!showAllDisasters) {
      filtered = filtered.filter((disaster) => disaster.status === 'active');
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter((disaster) => disaster.severity === selectedFilter);
    }

    return filtered;
  }, [disasters, showAllDisasters, selectedFilter]);

  // Memoize disaster stats calculation
  const stats = useMemo(() => {
    const active = disasters.filter((d) => d.status === 'active').length;
    const high = disasters.filter((d) => d.severity === 'high').length;
    const medium = disasters.filter((d) => d.severity === 'medium').length;
    const low = disasters.filter((d) => d.severity === 'low').length;

    return { active, high, medium, low, total: disasters.length };
  }, [disasters]);

  if (loading) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={[styles.loadingTitle, getTextStyle(language)]}>
              {t('riskMap.loading')}
            </Text>
            <Text style={[styles.loadingText, getTextStyle(language)]}>
              {t('riskMap.subtitle')}
            </Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>

      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>


        {/* Statistics Cards */}
          <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderColor: '#ef4444' }]}>
            <Text style={styles.statNumber}>{stats.high}</Text>
            <Text style={styles.statLabel}>{t('risk.high')}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#f59e0b' }]}>
            <Text style={styles.statNumber}>{stats.medium}</Text>
            <Text style={styles.statLabel}>{t('risk.medium')}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#10b981' }]}>
            <Text style={styles.statNumber}>{stats.low}</Text>
            <Text style={styles.statLabel}>{t('risk.low')}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#3b82f6' }]}>
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>{t('risk.status.active')}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <View style={styles.controlsRow}>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>{t('controls.showAllDisasters')}</Text>
              <Switch
                value={showAllDisasters}
                onValueChange={setShowAllDisasters}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={showAllDisasters ? '#3b82f6' : '#f3f4f6'}
                ios_backgroundColor="#d1d5db"
              />
            </View>

            {/* Debug Controls - Remove in production */}
            {__DEV__ && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.debugButton} onPress={clearCache}>
                  <Text style={styles.debugButtonText}>{t('debug.clearCache')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.debugButton} onPress={testAPIConnection}>
                  <Text style={styles.debugButtonText}>{t('debug.testApi')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Filter Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>{t('riskMap.all')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'high' && styles.filterButtonActive, { borderColor: '#ef4444' }]}
              onPress={() => setSelectedFilter('high')}
            >
              <Text style={[styles.filterText, selectedFilter === 'high' && styles.filterTextActive]}>🔴 {t('risk.high')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'medium' && styles.filterButtonActive, { borderColor: '#f59e0b' }]}
              onPress={() => setSelectedFilter('medium')}
            >
              <Text style={[styles.filterText, selectedFilter === 'medium' && styles.filterTextActive]}>🟡 {t('risk.medium')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'low' && styles.filterButtonActive, { borderColor: '#10b981' }]}
              onPress={() => setSelectedFilter('low')}
            >
              <Text style={[styles.filterText, selectedFilter === 'low' && styles.filterTextActive]}>🟢 {t('risk.low')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <LeafletMap
            key={`leaflet-${refreshFlag}`}
            points={disasters
              .filter((d) => {
                const hasLocation = d.location && typeof d.location === 'object';
                return hasLocation;
              })
              .map<LeafletDisasterPoint | null>((d) => {
                const lat = d.location?.lat;
                const lng = d.location?.lng;

                const latNum = Number(lat);
                const lngNum = Number(lng);

                if (isNaN(latNum) || isNaN(lngNum)) {
                  return null;
                }

                return {
                  id: d._id,
                  latitude: latNum,
                  longitude: lngNum,
                  type: d.type,
                  severity: d.severity,
                  description: d.description,
                  timestamp: d.timestamp,
                };
              })
              .filter((point): point is LeafletDisasterPoint => point !== null)}
            userLocation={userLocation}
          />

          {/* Map Controls */}
          <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
            <Text style={styles.recenterIcon}>🎯</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshMapButton} onPress={fetchDisasters}>
            <Text style={styles.refreshMapIcon}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Disaster List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{showAllDisasters ? t('list.allDisasters') : t('list.activeDisasters')}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredDisasters.length}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.disasterList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
          >
            {filteredDisasters.length > 0 ? (
              filteredDisasters.map((disaster, index) => (
                <View
                  key={disaster._id}
                  style={[styles.disasterItem, index === filteredDisasters.length - 1 && styles.lastDisasterItem]}
                >
                  <View style={styles.disasterHeader}>
                    <View style={styles.disasterLeft}>
                      <View style={[styles.disasterIconContainer, { backgroundColor: getRiskColor(disaster.severity) }]}>
                        <Text style={styles.disasterIcon}>{getDisasterIcon(disaster.type)}</Text>
                      </View>
                      <View style={styles.disasterInfo}>
                        <Text style={styles.disasterType}>
                          {t(`alerts.${disaster.type}`)}
                        </Text>
                        <Text style={styles.disasterDescription} numberOfLines={2}>
                          {disaster.description}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.disasterRight}>
                      <View style={[styles.severityBadge, { backgroundColor: getRiskColor(disaster.severity) }]}>
                        <Text style={styles.severityText}>{t(`risk.${disaster.severity}`)}</Text>
                      </View>
                      <Text style={styles.timeText}>{getTimeAgo(disaster.timestamp)}</Text>
                    </View>
                  </View>

                  <View style={styles.disasterDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <Text style={styles.locationText}>
                        {disaster.location.lat.toFixed(4)}, {disaster.location.lng.toFixed(4)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>🔄</Text>
                        <Text
                          style={[
                            styles.statusText,
                            { color: disaster.status === 'active' ? '#ef4444' : '#10b981' },
                          ]}
                        >
                          {t(`risk.status.${disaster.status}`)}
                        </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataIcon}>🗺️</Text>
                <Text style={styles.noDataText}>{t('riskMap.noDisasters')}</Text>
                <Text style={styles.noDataSubtext}>
                  {showAllDisasters ? t('riskMap.noMatch') : t('riskMap.noActive')}
                </Text>
                <TouchableOpacity style={styles.refreshButton} onPress={fetchDisasters}>
                  <Text style={styles.refreshButtonText}>🔄 {t('riskMap.refresh')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    paddingTop: StatusBar.currentHeight || 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },

  // New compact header styles
  compactHeader: {
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactBackIcon: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  compactHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  compactHeaderIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  compactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  compactSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  compactOfflineIndicator: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactOfflineText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16, // Removed negative marginTop for clean spacing
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  controlsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1f2937',
    marginRight: 12,
    fontWeight: '500',
  },
  filterScroll: {
    marginTop: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 280,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recenterButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recenterIcon: {
    fontSize: 18,
  },
  refreshMapButton: {
    position: 'absolute',
    top: 12,
    right: 60,
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshMapIcon: {
    fontSize: 18,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  countBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  disasterList: {
    flex: 1,
    maxHeight: 300,
  },
  disasterItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastDisasterItem: {
    borderBottomWidth: 0,
  },
  disasterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  disasterLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  disasterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  disasterIcon: {
    fontSize: 20,
  },
  disasterInfo: {
    flex: 1,
  },
  disasterType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  disasterDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  disasterRight: {
    alignItems: 'flex-end',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  severityText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  disasterDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  locationText: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RiskMapScreen;
