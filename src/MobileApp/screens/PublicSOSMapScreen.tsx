import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Public SOS Map Screen
 * Shows nearby SOS signals visible to civilians (based on their certifications)
 * Allows verified responders to accept SOS assignments
 */
const PublicSOSMapScreen = ({ navigation }: any) => {
  const [sosSignals, setSosSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responderProfile, setResponderProfile] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  useEffect(() => {
    loadResponderProfile();
    loadUserLocation();
    loadNearbySOS();
    
    // Poll every 15 seconds for new SOS signals
    const interval = setInterval(loadNearbySOS, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadResponderProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        `${API_BASE_URL}/api/civilian-responder/profile`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setResponderProfile(response.data.data);
    } catch (error) {
      // Not a verified responder - can still view SOS
      console.log('Not a civilian responder');
    }
  };
  
  const loadUserLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        // Default to Colombo
        setUserLocation({ lat: 6.9271, lng: 79.8612 });
      }
    );
  };
  
  const loadNearbySOS = async () => {
    if (!userLocation) return;
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.get(
        `${API_BASE_URL}/api/sos/public/nearby`,
        {
          params: {
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius_km: responderProfile?.availability_radius_km || 10
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSosSignals(response.data.data);
    } catch (error) {
      console.error('Error loading SOS signals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleAcceptSOS = (sosId: string, sosLevel: string) => {
    Alert.alert(
      'Accept SOS Assignment?',
      `This is a ${sosLevel.toUpperCase()} emergency. Are you available and willing to respond?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I will help',
          onPress: () => confirmAcceptSOS(sosId)
        }
      ]
    );
  };
  
  const confirmAcceptSOS = async (sosId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      await axios.post(
        `${API_BASE_URL}/api/sos/${sosId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      Alert.alert(
        'SOS Accepted!',
        'You have been assigned to this emergency. Please proceed to the location.',
        [
          {
            text: 'View Details',
            onPress: () => navigation.navigate('ResponderDashboard', { activeResponseId: sosId })
          }
        ]
      );
      
      loadNearbySOS(); // Refresh list
    } catch (error: any) {
      console.error('Error accepting SOS:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to accept SOS. You may not be verified or available.'
      );
    }
  };
  
  const getSOSLevelColor = (level: string) => {
    switch (level) {
      case 'level_1': return '#4caf50';
      case 'level_2': return '#ff9800';
      case 'level_3': return '#f44336';
      default: return '#999';
    }
  };
  
  const getSOSLevelText = (level: string) => {
    switch (level) {
      case 'level_1': return 'Food/Water';
      case 'level_2': return 'Medical';
      case 'level_3': return 'Life-Threatening';
      default: return level;
    }
  };
  
  const getSOSLevelIcon = (level: string) => {
    switch (level) {
      case 'level_1': return '🍴';
      case 'level_2': return '⚕️';
      case 'level_3': return '🚨';
      default: return '⚠️';
    }
  };
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const canAcceptSOS = (sosLevel: string) => {
    if (!responderProfile) return false;
    if (responderProfile.verification_status !== 'verified') return false;
    if (!responderProfile.is_available) return false;
    return responderProfile.allowed_sos_levels.includes(sosLevel);
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading nearby SOS signals...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Active SOS Signals</Text>
        <Text style={styles.headerSubtitle}>
          {sosSignals.length} active emergency {sosSignals.length === 1 ? 'call' : 'calls'} nearby
        </Text>
      </View>
      
      {/* Responder Status */}
      {responderProfile && (
        <View style={[
          styles.statusBanner,
          { backgroundColor: responderProfile.verification_status === 'verified' ? '#4caf50' : '#ff9800' }
        ]}>
          <Text style={styles.statusBannerText}>
            {responderProfile.verification_status === 'verified'
              ? `✅ Verified Responder (Level ${responderProfile.allowed_sos_levels.length})`
              : '⏳ Responder Verification Pending'}
          </Text>
        </View>
      )}
      
      {!responderProfile && (
        <View style={styles.notResponderBanner}>
          <Text style={styles.notResponderText}>
            👀 You can view SOS signals, but only verified responders can accept them.
          </Text>
          <TouchableOpacity
            style={styles.becomeResponderButton}
            onPress={() => navigation.navigate('CivilianResponderRegistration')}
          >
            <Text style={styles.becomeResponderButtonText}>Become a Responder →</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* SOS List */}
      <ScrollView
        style={styles.sosList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadNearbySOS();
          }} />
        }
      >
        {sosSignals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>No Active SOS Signals</Text>
            <Text style={styles.emptySubtitle}>
              All clear in your area. We'll notify you if an emergency occurs.
            </Text>
          </View>
        ) : (
          sosSignals.map((sos: any) => {
            const distance = userLocation
              ? calculateDistance(userLocation.lat, userLocation.lng, sos.location.coordinates[1], sos.location.coordinates[0])
              : 0;
            
            const canAccept = canAcceptSOS(sos.sos_level);
            
            return (
              <View key={sos._id} style={styles.sosCard}>
                {/* Level Badge */}
                <View style={[styles.levelBadge, { backgroundColor: getSOSLevelColor(sos.sos_level) }]}>
                  <Text style={styles.levelIcon}>{getSOSLevelIcon(sos.sos_level)}</Text>
                  <Text style={styles.levelText}>{getSOSLevelText(sos.sos_level)}</Text>
                </View>
                
                {/* Location Info */}
                <View style={styles.sosInfo}>
                  <Text style={styles.sosAddress}>{sos.location_address || 'Location not available'}</Text>
                  <Text style={styles.sosDistance}>📍 {distance.toFixed(2)} km away</Text>
                  <Text style={styles.sosTime}>
                    ⏰ {new Date(sos.created_at).toLocaleTimeString()} ({Math.floor((Date.now() - new Date(sos.created_at).getTime()) / 60000)} min ago)
                  </Text>
                </View>
                
                {/* Description */}
                {sos.description && (
                  <View style={styles.sosDescription}>
                    <Text style={styles.sosDescriptionText}>{sos.description}</Text>
                  </View>
                )}
                
                {/* Actions */}
                <View style={styles.sosActions}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => navigation.navigate('SOSDetails', { sosId: sos._id })}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                  
                  {canAccept ? (
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptSOS(sos._id, sos.sos_level)}
                    >
                      <Text style={styles.acceptButtonText}>✋ Accept</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.cannotAcceptButton}>
                      <Text style={styles.cannotAcceptButtonText}>
                        {!responderProfile
                          ? 'Not Verified'
                          : !responderProfile.is_available
                          ? 'Unavailable'
                          : 'Cert Required'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      
      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {responderProfile && (
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={() => navigation.navigate('ResponderDashboard')}
          >
            <Text style={styles.dashboardButtonText}>📊 My Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#999'
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666'
  },
  statusBanner: {
    padding: 12,
    alignItems: 'center'
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  notResponderBanner: {
    backgroundColor: '#fff3cd',
    padding: 16,
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107'
  },
  notResponderText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12
  },
  becomeResponderButton: {
    backgroundColor: '#ffc107',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  becomeResponderButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  sosList: {
    flex: 1
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  sosCard: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden'
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12
  },
  levelIcon: {
    fontSize: 24,
    marginRight: 8
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  sosInfo: {
    padding: 16,
    paddingTop: 8
  },
  sosAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6
  },
  sosDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  sosTime: {
    fontSize: 14,
    color: '#999'
  },
  sosDescription: {
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  sosDescriptionText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  sosActions: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5'
  },
  viewButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    alignItems: 'center'
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  acceptButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2196f3',
    alignItems: 'center'
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  cannotAcceptButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center'
  },
  cannotAcceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999'
  },
  bottomActions: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  dashboardButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  }
});

export default PublicSOSMapScreen;
