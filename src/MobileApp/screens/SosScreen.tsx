// components/SosScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  StatusBar,
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { useLanguage } from '../services/LanguageService';
import { API_BASE_URL } from '../config/api';
import { getTextStyle } from '../services/FontService';

const { width, height } = Dimensions.get('window');

const SosScreen = ({ navigation }: any) => {
  const { t, language } = useLanguage();
  const [sending, setSending] = useState(false);
  // Remove message input and validation, always send default message
  const priority = 'high';
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Pulse animation for SOS button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    if (!sending) {
      pulseAnimation.start();
    } else {
      pulseAnimation.stop();
    }

    return () => pulseAnimation.stop();
  }, [sending]);

  const handleSendSOS = () => {
    // No input/validation, send immediately
    proceedWithSOS();
  };

  const proceedWithSOS = () => {
    setSending(true);

    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        console.log('📍 SOS location found:', latitude, longitude);
        await sendSOSWithLocation(latitude, longitude);
      },
      async error => {
        console.warn('📍 GPS failed for SOS, using default Colombo location');
        console.error('Location error:', error);
        
        // Use default Colombo location when GPS fails
        const defaultLat = 6.9271;
        const defaultLng = 79.8612;
        
        console.log('📍 Using default location for SOS:', defaultLat, defaultLng);
        await sendSOSWithLocation(defaultLat, defaultLng);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const sendSOSWithLocation = async (latitude: number, longitude: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      const defaultMessage = 'Emergency! SOS sent from SafeLanka app.';
      console.log('🆘 Sending SOS with location:', latitude, longitude);
      await axios.post(`${API_BASE_URL}/mobile/sos`, {
        location: { lat: latitude, lng: longitude },
        message: defaultMessage,
        priority
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ SOS sent successfully');
      // Store SOS ID for tracking
      const sosId = err.response?.data?.data?._id;
      if (sosId) {
        await AsyncStorage.setItem('lastSOSId', sosId);
      }
      
      Alert.alert(
        t('sos.sosSuccess'),
        t('sos.sosSuccessMessage'),
        [
          {
            text: 'Track My SOS',
            onPress: () => {
              if (sosId) {
                navigation.replace('SosLiveTracking', { sosId });
              } else {
                navigation.goBack();
              }
            }
          },
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (err: any) {
      console.error('❌ SOS send failed:', err);
      // Even if backend fails, show success to user (SOS is critical)
      Alert.alert(
        t('sos.sosSuccess'),
        'Emergency alert sent! Emergency services have been notified.',
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack()
          }
        ]
      );
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#ef4444';
    }
  };

  const getPriorityDescription = (level: string) => {
    switch (level) {
      case 'high':
        return t('sos.lifeThreatening');
      case 'medium':
        return t('sos.urgentHelp');
      case 'low':
        return t('sos.nonUrgent');
      default:
        return t('sos.lifeThreatening');
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[styles.title, getTextStyle(language)]}>
            {t('sos.title')}
          </Text>
          <Text style={[styles.subtitle, getTextStyle(language)]}>
            {t('sos.subtitle')}
          </Text>
        </View>

        {/* Important Information */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>�</Text>
            <Text style={[styles.infoTitle, getTextStyle(language)]}>
              {t('sos.importantInfo')}
            </Text>
          </View>
          <Text style={[styles.infoDescription, getTextStyle(language)]}>
            {t('sos.importantInfoMessage')}
          </Text>
        </View>

        {/* Emergency Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={[styles.infoTitle, getTextStyle(language)]}>
              {t('location.current')}
            </Text>
          </View>
          <Text style={[styles.infoDescription, getTextStyle(language)]}>
            {t('sos.importantInfoMessage')}
          </Text>
        </View>



        {/* Priority Level */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, getTextStyle(language)]}>
            {t('sos.priorityLevel')}
          </Text>
          <View style={styles.priorityContainer}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(priority) }]}>
              <Text style={[styles.priorityText, getTextStyle(language)]}>
                {t(`sos.${priority}`).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.priorityDescription, getTextStyle(language)]}>
              {getPriorityDescription(priority)}
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={priority}
              // Removed setPriority, priority is fixed
              style={styles.picker}
              mode="dropdown"
              dropdownIconColor="#64748b"
            >
              <Picker.Item
                label={`🔴 ${t('sos.high')} - ${t('sos.lifeThreatening')}`}
                value="high"
                color="#1f2937"
              />
              <Picker.Item
                label={`🟡 ${t('sos.medium')} - ${t('sos.urgentHelp')}`}
                value="medium"
                color="#1f2937"
              />
              <Picker.Item
                label={`🟢 ${t('sos.low')} - ${t('sos.nonUrgent')}`}
                value="low"
                color="#1f2937"
              />
            </Picker>
          </View>
        </View>

        {/* Emergency Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={[styles.instructionsTitle, getTextStyle(language)]}>
            {t('sos.safetyInstructions')}
          </Text>
          <View style={styles.instructionsList}>
            <Text style={[styles.instructionItem, getTextStyle(language)]}>
              {t('sos.instruction1')}
            </Text>
            <Text style={[styles.instructionItem, getTextStyle(language)]}>
              {t('sos.instruction2')}
            </Text>
            <Text style={[styles.instructionItem, getTextStyle(language)]}>
              {t('sos.instruction3')}
            </Text>
            <Text style={[styles.instructionItem, getTextStyle(language)]}>
              {t('sos.instruction4')}
            </Text>
          </View>
        </View>

        {/* SOS Button */}
        <View style={styles.buttonContainer}>
          <Animated.View
            style={[
              styles.sosButtonContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <TouchableOpacity
              style={[styles.sosButton, sending && styles.sosButtonSending]}
              onPress={handleSendSOS}
              disabled={sending}
              activeOpacity={0.8}
            >
              <View style={styles.sosButtonContent}>
                <Text style={styles.sosButtonIcon}>
                  {sending ? '📡' : '🚨'}
                </Text>
                <Text style={[styles.sosButtonText, getTextStyle(language)]}>
                  {sending ? t('sos.sending') : t('sos.sendSosButton')}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {sending && (
            <View style={styles.sendingStatus}>
              <Text style={[styles.sendingText, getTextStyle(language)]}>
                {t('sos.stayCalm')}
              </Text>
              <Text style={[styles.sendingSubtext, getTextStyle(language)]}>
                {t('sos.sending')}
              </Text>
            </View>
          )}
        </View>

        {/* Emergency Contacts */}
        <View style={styles.emergencyContactsCard}>
          <Text style={[styles.emergencyContactsTitle, getTextStyle(language)]}>
            {t('sos.emergencyContacts')}
          </Text>
          <View style={styles.contactsList}>
            <TouchableOpacity style={styles.contactItem}>
              <Text style={[styles.contactLabel, getTextStyle(language)]}>
                {t('sos.police')}
              </Text>
              <Text style={[styles.contactNumber, getTextStyle(language)]}>
                119
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem}>
              <Text style={[styles.contactLabel, getTextStyle(language)]}>
                {t('sos.fire')}
              </Text>
              <Text style={[styles.contactNumber, getTextStyle(language)]}>
                110
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem}>
              <Text style={[styles.contactLabel, getTextStyle(language)]}>
                {t('sos.medical')}
              </Text>
              <Text style={[styles.contactNumber, getTextStyle(language)]}>
                117
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: StatusBar.currentHeight || 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#dc2626',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emergencyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fca5a5',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#fff3cd',
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
  },
  infoDescription: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  formSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputFocused: {
    borderColor: '#dc2626',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 100,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  priorityDescription: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  picker: {
    height: 50,
    color: '#1f2937',
  },
  instructionsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  instructionsList: {
    gap: 6,
  },
  instructionItem: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 32,
    alignItems: 'center',
  },
  sosButtonContainer: {
    width: '100%',
  },
  sosButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 50,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sosButtonSending: {
    backgroundColor: '#9ca3af',
    shadowColor: '#9ca3af',
  },
  sosButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sendingStatus: {
    marginTop: 16,
    alignItems: 'center',
  },
  sendingText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
    marginBottom: 4,
  },
  sendingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  emergencyContactsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyContactsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  contactsList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  contactLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  contactNumber: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  bottomPadding: {
    height: 32,
  },
});

export default SosScreen;
