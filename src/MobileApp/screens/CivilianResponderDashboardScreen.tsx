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
 * Civilian Responder Dashboard (Lite Version)
 * Shows assigned SOS, active responses, statistics, and certifications
 * For civilians who have registered as Good Samaritan responders
 */
const CivilianResponderDashboardScreen = ({ route, navigation }: any) => {
  const { activeResponseId } = route.params || {};
  
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeResponse, setActiveResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadData();
    
    // Poll every 10 seconds if there's an active response
    let interval: any;
    if (activeResponse) {
      interval = setInterval(loadData, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeResponse]);
  
  const loadData = async () => {
    try {
      await Promise.all([
        loadProfile(),
        loadStats(),
        activeResponseId && loadActiveResponse()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        `${API_BASE_URL}/api/civilian-responder/profile`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setProfile(response.data.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };
  
  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        `${API_BASE_URL}/api/civilian-responder/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  const loadActiveResponse = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        `${API_BASE_URL}/api/sos/${activeResponseId}/status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.data.active_response) {
        setActiveResponse(response.data.data.active_response);
      }
    } catch (error) {
      console.error('Error loading active response:', error);
    }
  };
  
  const handleToggleAvailability = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      await axios.put(
        `${API_BASE_URL}/api/civilian-responder/availability`,
        { is_available: !profile.is_available },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      loadProfile();
    } catch (error) {
      console.error('Error toggling availability:', error);
      Alert.alert('Error', 'Failed to update availability');
    }
  };
  
  const handleUpdateLocation = async () => {
    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          
          await axios.put(
            `${API_BASE_URL}/api/civilian-responder/location`,
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          Alert.alert('Success', 'Location updated successfully');
          loadProfile();
        } catch (error) {
          console.error('Error updating location:', error);
          Alert.alert('Error', 'Failed to update location');
        }
      },
      (error) => {
        Alert.alert('Error', 'Failed to get GPS location');
      }
    );
  };
  
  const handleUpdateStatus = async (status: string) => {
    if (!activeResponse) return;
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      Geolocation.getCurrentPosition(
        async (position) => {
          await axios.put(
            `${API_BASE_URL}/api/sos/response/${activeResponse._id}/status`,
            {
              status,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          Alert.alert('Success', `Status updated to ${status}`);
          loadActiveResponse();
        },
        async () => {
          // Fallback without location
          await axios.put(
            `${API_BASE_URL}/api/sos/response/${activeResponse._id}/status`,
            { status },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          Alert.alert('Success', `Status updated to ${status}`);
          loadActiveResponse();
        }
      );
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };
  
  const handleCompleteRescue = () => {
    navigation.navigate('CompleteRescueForm', { responseId: activeResponse._id });
  };
  
  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadData();
          }} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.full_name.charAt(0)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{profile.full_name}</Text>
            <Text style={styles.headerStatus}>
              {profile.verification_status === 'verified' ? '✅ Verified Responder' : '⏳ Pending Verification'}
            </Text>
          </View>
        </View>
        
        {/* Availability Toggle */}
        <View style={styles.card}>
          <View style={styles.availabilityHeader}>
            <Text style={styles.cardTitle}>Availability Status</Text>
            <TouchableOpacity
              style={[styles.availabilityToggle, profile.is_available && styles.availabilityToggleActive]}
              onPress={handleToggleAvailability}
            >
              <Text style={styles.availabilityToggleText}>
                {profile.is_available ? 'Available' : 'Unavailable'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.availabilitySubtext}>
            {profile.is_available
              ? 'You will receive nearby SOS alerts'
              : 'You will not receive SOS alerts'}
          </Text>
          <TouchableOpacity style={styles.updateLocationButton} onPress={handleUpdateLocation}>
            <Text style={styles.updateLocationButtonText}>📍 Update My Location</Text>
          </TouchableOpacity>
        </View>
        
        {/* Active Response */}
        {activeResponse && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚨 Active Response</Text>
            <View style={styles.activeResponseInfo}>
              <Text style={styles.activeResponseLevel}>
                Level {activeResponse.sos_signal_id.sos_level.split('_')[1]} Emergency
              </Text>
              <Text style={styles.activeResponseAddress}>
                {activeResponse.sos_signal_id.location_address}
              </Text>
            </View>
            
            {/* Status Update Buttons */}
            <View style={styles.statusButtons}>
              {activeResponse.status === 'assigned' && (
                <TouchableOpacity
                  style={[styles.statusButton, styles.statusButtonPrimary]}
                  onPress={() => handleUpdateStatus('en_route')}
                >
                  <Text style={styles.statusButtonText}>🚗 I'm On My Way</Text>
                </TouchableOpacity>
              )}
              
              {activeResponse.status === 'en_route' && (
                <TouchableOpacity
                  style={[styles.statusButton, styles.statusButtonPrimary]}
                  onPress={() => handleUpdateStatus('arrived')}
                >
                  <Text style={styles.statusButtonText}>📍 I've Arrived</Text>
                </TouchableOpacity>
              )}
              
              {activeResponse.status === 'arrived' && (
                <TouchableOpacity
                  style={[styles.statusButton, styles.statusButtonPrimary]}
                  onPress={() => handleUpdateStatus('assisting')}
                >
                  <Text style={styles.statusButtonText}>⚕️ Assisting Victim</Text>
                </TouchableOpacity>
              )}
              
              {['arrived', 'assisting'].includes(activeResponse.status) && (
                <TouchableOpacity
                  style={[styles.statusButton, styles.statusButtonSuccess]}
                  onPress={handleCompleteRescue}
                >
                  <Text style={styles.statusButtonText}>✅ Complete Rescue</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.viewSOSButton}
              onPress={() => navigation.navigate('SosLiveTracking', { sosId: activeResponse.sos_signal_id._id })}
            >
              <Text style={styles.viewSOSButtonText}>View Full Details →</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Statistics */}
        {stats && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Your Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total_responses || 0}</Text>
                <Text style={styles.statLabel}>Total Responses</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.success_rate || 0}%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.average_response_time || 0}</Text>
                <Text style={styles.statLabel}>Avg Time (min)</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats.rating ? `⭐ ${stats.rating.toFixed(1)}` : 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Certifications */}
        <View style={styles.card}>
          <View style={styles.certHeader}>
            <Text style={styles.cardTitle}>📜 Certifications</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CivilianResponderRegistration', { step: 'upload_cert' })}
            >
              <Text style={styles.addCertButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          
          {profile.certifications && profile.certifications.length > 0 ? (
            <View style={styles.certList}>
              {profile.certifications.map((cert: any, index: number) => (
                <View key={index} style={styles.certItem}>
                  <View style={styles.certInfo}>
                    <Text style={styles.certType}>
                      {cert.type.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.certNumber}>#{cert.certificate_number}</Text>
                  </View>
                  <View style={[
                    styles.certBadge,
                    { backgroundColor: cert.verified ? '#4caf50' : '#ff9800' }
                  ]}>
                    <Text style={styles.certBadgeText}>
                      {cert.verified ? '✓ Verified' : '⏳ Pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noCerts}>No certifications added yet.</Text>
          )}
        </View>
        
        {/* Allowed SOS Levels */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 You Can Respond To</Text>
          <View style={styles.levelsGrid}>
            <View style={[styles.levelBox, profile.allowed_sos_levels.includes('level_1') && styles.levelBoxActive, { borderColor: '#4caf50' }]}>
              <Text style={styles.levelBoxIcon}>🍴</Text>
              <Text style={styles.levelBoxText}>Level 1</Text>
              <Text style={styles.levelBoxSubtext}>Food/Water</Text>
            </View>
            <View style={[styles.levelBox, profile.allowed_sos_levels.includes('level_2') && styles.levelBoxActive, { borderColor: '#ff9800' }]}>
              <Text style={styles.levelBoxIcon}>⚕️</Text>
              <Text style={styles.levelBoxText}>Level 2</Text>
              <Text style={styles.levelBoxSubtext}>Medical</Text>
            </View>
            <View style={[styles.levelBox, profile.allowed_sos_levels.includes('level_3') && styles.levelBoxActive, { borderColor: '#f44336' }]}>
              <Text style={styles.levelBoxIcon}>🚨</Text>
              <Text style={styles.levelBoxText}>Level 3</Text>
              <Text style={styles.levelBoxSubtext}>Life-Threat</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={styles.sosMapButton}
          onPress={() => navigation.navigate('PublicSOSMap')}
        >
          <Text style={styles.sosMapButtonText}>🗺️ View Nearby SOS Signals</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerInfo: {
    flex: 1
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  headerStatus: {
    fontSize: 14,
    color: '#666'
  },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  availabilityToggle: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  availabilityToggleActive: {
    backgroundColor: '#4caf50'
  },
  availabilityToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  availabilitySubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  updateLocationButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  updateLocationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196f3'
  },
  activeResponseInfo: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  activeResponseLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f57c00',
    marginBottom: 4
  },
  activeResponseAddress: {
    fontSize: 14,
    color: '#666'
  },
  statusButtons: {
    marginBottom: 12
  },
  statusButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8
  },
  statusButtonPrimary: {
    backgroundColor: '#2196f3'
  },
  statusButtonSuccess: {
    backgroundColor: '#4caf50'
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  viewSOSButton: {
    padding: 8,
    alignItems: 'center'
  },
  viewSOSButtonText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '600'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#999'
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  addCertButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3'
  },
  certList: {
    marginTop: 8
  },
  certItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8
  },
  certInfo: {
    flex: 1
  },
  certType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  certNumber: {
    fontSize: 12,
    color: '#999'
  },
  certBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  certBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff'
  },
  noCerts: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 16
  },
  levelsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  levelBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
    marginHorizontal: 4,
    opacity: 0.4
  },
  levelBoxActive: {
    opacity: 1,
    backgroundColor: '#f5f5f5'
  },
  levelBoxIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  levelBoxText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  levelBoxSubtext: {
    fontSize: 10,
    color: '#666'
  },
  bottomAction: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  sosMapButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  sosMapButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  }
});

export default CivilianResponderDashboardScreen;
