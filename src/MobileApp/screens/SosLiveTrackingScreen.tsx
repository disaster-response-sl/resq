import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * SOS Live Tracking Screen
 * Shows real-time status updates for victim after sending SOS
 * Includes responder location, ETA, and chat
 */
const SosLiveTrackingScreen = ({ route, navigation }: any) => {
  const { sosId } = route.params;
  
  const [sosStatus, setSosStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  
  useEffect(() => {
    loadSosStatus();
    
    // Poll every 10 seconds for updates
    const interval = setInterval(loadSosStatus, 10000);
    
    return () => clearInterval(interval);
  }, [sosId]);
  
  const loadSosStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.get(
        `${API_BASE_URL}/api/sos/${sosId}/status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSosStatus(response.data.data);
    } catch (error) {
      console.error('Error loading SOS status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleMarkSafe = () => {
    Alert.alert(
      'Are You Safe?',
      'If you are safe now, we will cancel the SOS and free up the responder.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I am Safe',
          onPress: confirmMarkSafe
        }
      ]
    );
  };
  
  const confirmMarkSafe = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      Geolocation.getCurrentPosition(
        async (position) => {
          await axios.post(
            `${API_BASE_URL}/api/sos/${sosId}/mark-safe`,
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          Alert.alert('Success', 'SOS cancelled. Glad you are safe!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        },
        async () => {
          // Use default location if GPS fails
          await axios.post(
            `${API_BASE_URL}/api/sos/${sosId}/mark-safe`,
            { lat: 6.9271, lng: 79.8612 },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          Alert.alert('Success', 'SOS cancelled. Glad you are safe!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      );
    } catch (error: any) {
      console.error('Error marking safe:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark as safe');
    }
  };
  
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !sosStatus?.active_response?._id) return;
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      await axios.post(
        `${API_BASE_URL}/api/sos/response/${sosStatus.active_response._id}/chat`,
        { message: chatMessage },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setChatMessage('');
      loadSosStatus(); // Refresh to show new message
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };
  
  if (loading || !sosStatus) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading SOS status...</Text>
      </View>
    );
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'acknowledged': return '#2196f3';
      case 'responding': return '#2196f3';
      case 'resolved': return '#4caf50';
      case 'false_alarm': return '#9e9e9e';
      default: return '#999';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for responder...';
      case 'acknowledged': return 'Responder assigned!';
      case 'responding': return 'Help is on the way!';
      case 'resolved': return 'SOS resolved';
      case 'false_alarm': return 'Cancelled';
      default: return status;
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadSosStatus();
          }} />
        }
      >
        {/* Status Header */}
        <View style={[styles.statusHeader, { backgroundColor: getStatusColor(sosStatus.sos_status) }]}>
          <Text style={styles.statusIcon}>🚨</Text>
          <Text style={styles.statusTitle}>{getStatusText(sosStatus.sos_status)}</Text>
        </View>
        
        {/* Responder Info */}
        {sosStatus.active_response && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Responder</Text>
            <View style={styles.responderInfo}>
              <View style={styles.responderAvatar}>
                <Text style={styles.responderAvatarText}>
                  {sosStatus.active_response.responder_name.charAt(0)}
                </Text>
              </View>
              <View style={styles.responderDetails}>
                <Text style={styles.responderName}>
                  {sosStatus.active_response.responder_name}
                </Text>
                <Text style={styles.responderOrg}>
                  {sosStatus.active_response.responder_organization}
                </Text>
                <Text style={styles.responderPhone}>
                  📞 {sosStatus.active_response.responder_phone}
                </Text>
              </View>
            </View>
            
            {/* Responder Status */}
            <View style={styles.responderStatus}>
              <View style={styles.statusStep}>
                <View style={[styles.statusDot, sosStatus.active_response.status === 'assigned' && styles.statusDotActive]} />
                <Text style={styles.statusStepText}>Assigned</Text>
              </View>
              <View style={styles.statusLine} />
              <View style={styles.statusStep}>
                <View style={[styles.statusDot, sosStatus.active_response.status === 'en_route' && styles.statusDotActive]} />
                <Text style={styles.statusStepText}>En Route</Text>
              </View>
              <View style={styles.statusLine} />
              <View style={styles.statusStep}>
                <View style={[styles.statusDot, sosStatus.active_response.status === 'arrived' && styles.statusDotActive]} />
                <Text style={styles.statusStepText}>Arrived</Text>
              </View>
            </View>
            
            {/* Distance & ETA */}
            {sosStatus.distance_to_victim_km && (
              <View style={styles.distanceInfo}>
                <Text style={styles.distanceText}>
                  📍 {sosStatus.distance_to_victim_km.toFixed(2)} km away
                </Text>
                {sosStatus.estimated_arrival_time && (
                  <Text style={styles.etaText}>
                    ⏱️ ETA: {new Date(sosStatus.estimated_arrival_time).toLocaleTimeString()}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        
        {/* Live Updates */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Updates</Text>
          {sosStatus.victim_status_updates && sosStatus.victim_status_updates.length > 0 ? (
            <View style={styles.timeline}>
              {[...sosStatus.victim_status_updates].reverse().map((update: any, index: number) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineMessage}>{update.message}</Text>
                    <Text style={styles.timelineTime}>
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noUpdates}>No updates yet. Waiting for responder...</Text>
          )}
        </View>
        
        {/* Chat Messages */}
        {sosStatus.chat_messages && sosStatus.chat_messages.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Messages ({sosStatus.chat_messages.length})</Text>
            {sosStatus.chat_messages.slice(-3).map((msg: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.chatMessage,
                  msg.sender_type === 'victim' && styles.chatMessageOwn
                ]}
              >
                <Text style={styles.chatSender}>{msg.sender_name}</Text>
                <Text style={styles.chatText}>{msg.message}</Text>
                <Text style={styles.chatTime}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.viewChatButton}
              onPress={() => setShowChat(true)}
            >
              <Text style={styles.viewChatButtonText}>View All Messages →</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actions}>
          {sosStatus.active_response && (
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => setShowChat(true)}
            >
              <Text style={styles.actionButtonText}>💬 Chat with Responder</Text>
            </TouchableOpacity>
          )}
          
          {sosStatus.sos_status !== 'resolved' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.safeButton]}
              onPress={handleMarkSafe}
            >
              <Text style={styles.actionButtonText}>✅ I Am Safe</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      {/* Chat Modal */}
      <Modal
        visible={showChat}
        animationType="slide"
        onRequestClose={() => setShowChat(false)}
      >
        <View style={styles.chatModal}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatHeaderTitle}>Chat with Responder</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Text style={styles.chatHeaderClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.chatMessages}>
            {sosStatus.chat_messages?.map((msg: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.chatBubble,
                  msg.sender_type === 'victim' && styles.chatBubbleOwn
                ]}
              >
                <Text style={styles.chatBubbleSender}>{msg.sender_name}</Text>
                <Text style={styles.chatBubbleText}>{msg.message}</Text>
                <Text style={styles.chatBubbleTime}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.chatInput}>
            <TextInput
              style={styles.chatTextInput}
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Type a message..."
              multiline
            />
            <TouchableOpacity
              style={styles.chatSendButton}
              onPress={handleSendMessage}
            >
              <Text style={styles.chatSendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  statusHeader: {
    padding: 24,
    alignItems: 'center'
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
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
  responderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  responderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  responderAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  responderDetails: {
    flex: 1
  },
  responderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  responderOrg: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  responderPhone: {
    fontSize: 14,
    color: '#2196f3'
  },
  responderStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8
  },
  statusStep: {
    alignItems: 'center'
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginBottom: 4
  },
  statusDotActive: {
    backgroundColor: '#4caf50'
  },
  statusStepText: {
    fontSize: 12,
    color: '#666'
  },
  statusLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
    marginBottom: 20
  },
  distanceInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8
  },
  distanceText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4
  },
  etaText: {
    fontSize: 14,
    color: '#666'
  },
  timeline: {
    paddingLeft: 8
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196f3',
    marginTop: 6,
    marginRight: 12
  },
  timelineContent: {
    flex: 1
  },
  timelineMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4
  },
  timelineTime: {
    fontSize: 12,
    color: '#999'
  },
  noUpdates: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 16
  },
  chatMessage: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  chatMessageOwn: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-end',
    marginLeft: 40
  },
  chatSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4
  },
  chatText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4
  },
  chatTime: {
    fontSize: 10,
    color: '#999'
  },
  viewChatButton: {
    marginTop: 8,
    padding: 8
  },
  viewChatButtonText: {
    fontSize: 14,
    color: '#2196f3',
    textAlign: 'center',
    fontWeight: '600'
  },
  actions: {
    padding: 12,
    paddingBottom: 24
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  chatButton: {
    backgroundColor: '#2196f3'
  },
  safeButton: {
    backgroundColor: '#4caf50'
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  chatModal: {
    flex: 1,
    backgroundColor: '#fff'
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  chatHeaderClose: {
    fontSize: 24,
    color: '#999'
  },
  chatMessages: {
    flex: 1,
    padding: 16
  },
  chatBubble: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '80%'
  },
  chatBubbleOwn: {
    backgroundColor: '#2196f3',
    alignSelf: 'flex-end'
  },
  chatBubbleSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4
  },
  chatBubbleText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4
  },
  chatBubbleTime: {
    fontSize: 10,
    color: '#999'
  },
  chatInput: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100
  },
  chatSendButton: {
    backgroundColor: '#2196f3',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center'
  },
  chatSendButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  }
});

export default SosLiveTrackingScreen;
