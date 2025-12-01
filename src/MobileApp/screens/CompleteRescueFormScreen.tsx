import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Complete Rescue Form
 * Allows responders to complete a rescue with outcome details
 * Optionally creates Missing Person entry if victim needs to be tracked
 */
const CompleteRescueFormScreen = ({ route, navigation }: any) => {
  const { responseId } = route.params;
  
  const [rescueOutcome, setRescueOutcome] = useState('rescued_safe');
  const [victimStatus, setVictimStatus] = useState('safe');
  const [notes, setNotes] = useState('');
  
  // Relief camp details
  const [transportedToCamp, setTransportedToCamp] = useState(false);
  const [reliefCampId, setReliefCampId] = useState('');
  const [reliefCampName, setReliefCampName] = useState('');
  
  // Missing person details (if creating entry)
  const [createMissingPersonEntry, setCreateMissingPersonEntry] = useState(false);
  const [victimName, setVictimName] = useState('');
  const [victimAge, setVictimAge] = useState('');
  const [victimGender, setVictimGender] = useState('male');
  const [victimDescription, setVictimDescription] = useState('');
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    // Validation
    if (!rescueOutcome) {
      Alert.alert('Error', 'Please select a rescue outcome');
      return;
    }
    
    if (transportedToCamp && (!reliefCampId || !reliefCampName)) {
      Alert.alert('Error', 'Please provide relief camp details');
      return;
    }
    
    if (createMissingPersonEntry) {
      if (!victimName || !victimAge || !reporterName || !reporterPhone) {
        Alert.alert('Error', 'Please fill in all required fields for Missing Person entry');
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const payload: any = {
        rescue_outcome: rescueOutcome,
        victim_status: victimStatus,
        notes
      };
      
      if (transportedToCamp) {
        payload.relief_camp_id = reliefCampId;
        payload.relief_camp_name = reliefCampName;
      }
      
      if (createMissingPersonEntry) {
        payload.create_missing_person_entry = true;
        payload.victim_name = victimName;
        payload.victim_age = parseInt(victimAge);
        payload.victim_gender = victimGender;
        payload.victim_description = victimDescription;
        payload.last_seen_location = lastSeenLocation;
        payload.reporter_name = reporterName;
        payload.reporter_phone = reporterPhone;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/sos/response/${responseId}/complete`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      Alert.alert(
        'Rescue Completed!',
        createMissingPersonEntry
          ? 'Rescue marked complete and victim added to Missing Persons database.'
          : 'Rescue marked complete. Thank you for your service!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('CivilianResponderDashboard')
          }
        ]
      );
    } catch (error: any) {
      console.error('Error completing rescue:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete rescue');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.form}>
        <Text style={styles.title}>Complete Rescue</Text>
        <Text style={styles.subtitle}>
          Please provide details about the rescue outcome
        </Text>
        
        {/* Rescue Outcome */}
        <View style={styles.field}>
          <Text style={styles.label}>Rescue Outcome *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={rescueOutcome}
              onValueChange={setRescueOutcome}
              style={styles.picker}
            >
              <Picker.Item label="Rescued - Safe" value="rescued_safe" />
              <Picker.Item label="Rescued - Injured" value="rescued_injured" />
              <Picker.Item label="Rescued - Critical Condition" value="rescued_critical" />
              <Picker.Item label="Transported to Hospital" value="transported_to_hospital" />
              <Picker.Item label="Transported to Camp" value="transported_to_camp" />
              <Picker.Item label="Victim Already Safe" value="victim_safe_already" />
              <Picker.Item label="Victim Not Found" value="victim_not_found" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>
        
        {/* Victim Status */}
        <View style={styles.field}>
          <Text style={styles.label}>Victim Status *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={victimStatus}
              onValueChange={setVictimStatus}
              style={styles.picker}
            >
              <Picker.Item label="Safe" value="safe" />
              <Picker.Item label="Injured" value="injured" />
              <Picker.Item label="Critical" value="critical" />
              <Picker.Item label="Deceased" value="deceased" />
            </Picker>
          </View>
        </View>
        
        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional information about the rescue..."
            multiline
            numberOfLines={4}
          />
        </View>
        
        {/* Transported to Camp Toggle */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setTransportedToCamp(!transportedToCamp)}
        >
          <View style={[styles.checkbox, transportedToCamp && styles.checkboxChecked]}>
            {transportedToCamp && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Transported to Relief Camp</Text>
        </TouchableOpacity>
        
        {/* Relief Camp Details */}
        {transportedToCamp && (
          <View style={styles.section}>
            <View style={styles.field}>
              <Text style={styles.label}>Relief Camp ID *</Text>
              <TextInput
                style={styles.input}
                value={reliefCampId}
                onChangeText={setReliefCampId}
                placeholder="e.g., CAMP-2024-001"
              />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Relief Camp Name *</Text>
              <TextInput
                style={styles.input}
                value={reliefCampName}
                onChangeText={setReliefCampName}
                placeholder="e.g., Colombo Central Relief Camp"
              />
            </View>
          </View>
        )}
        
        {/* Create Missing Person Entry Toggle */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setCreateMissingPersonEntry(!createMissingPersonEntry)}
        >
          <View style={[styles.checkbox, createMissingPersonEntry && styles.checkboxChecked]}>
            {createMissingPersonEntry && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Add to Missing Persons Database</Text>
        </TouchableOpacity>
        
        <Text style={styles.helpText}>
          Check this if the victim needs to be tracked in the Missing Persons system
          (e.g., family needs to find them at relief camp)
        </Text>
        
        {/* Missing Person Details */}
        {createMissingPersonEntry && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Victim Information</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Victim Name *</Text>
              <TextInput
                style={styles.input}
                value={victimName}
                onChangeText={setVictimName}
                placeholder="Full name"
              />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                value={victimAge}
                onChangeText={setVictimAge}
                placeholder="Age"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={victimGender}
                  onValueChange={setVictimGender}
                  style={styles.picker}
                >
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Physical Description</Text>
              <TextInput
                style={styles.textArea}
                value={victimDescription}
                onChangeText={setVictimDescription}
                placeholder="Height, clothing, distinctive features..."
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Last Seen Location</Text>
              <TextInput
                style={styles.input}
                value={lastSeenLocation}
                onChangeText={setLastSeenLocation}
                placeholder="Where was the victim found?"
              />
            </View>
            
            <Text style={styles.sectionTitle}>Reporter Information (You)</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput
                style={styles.input}
                value={reporterName}
                onChangeText={setReporterName}
                placeholder="Your full name"
              />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Your Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={reporterPhone}
                onChangeText={setReporterPhone}
                placeholder="+94XXXXXXXXX"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Complete Rescue'}
          </Text>
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
  form: {
    flex: 1,
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24
  },
  field: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333'
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3'
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600'
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    fontStyle: 'italic'
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  submitButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    backgroundColor: '#9e9e9e'
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  }
});

export default CompleteRescueFormScreen;
