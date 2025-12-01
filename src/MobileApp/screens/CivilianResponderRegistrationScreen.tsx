import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import DocumentPicker from 'react-native-document-picker';
import { API_BASE_URL } from '../config/api';

/**
 * CivilianResponderRegistrationScreen
 * Good Samaritan Verification Layer - Allow civilians to become verified responders
 */
const CivilianResponderRegistrationScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<'register' | 'upload_cert' | 'completed'>('register');
  const [loading, setLoading] = useState(false);
  
  // Registration fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  
  // Certification fields
  const [certType, setCertType] = useState('red_cross');
  const [certNumber, setCertNumber] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  
  const handleRegister = async () => {
    if (!fullName || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      await axios.post(
        `${API_BASE_URL}/api/civilian-responder/register`,
        {
          full_name: fullName,
          phone,
          email,
          availability_radius_km: radiusKm
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      Alert.alert(
        'Registration Successful!',
        'You are now registered as a Civilian Responder. Please upload your certifications to get verified.',
        [{ text: 'OK', onPress: () => setStep('upload_cert') }]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
      });
      
      setSelectedFile(result[0]);
      Alert.alert('Success', `Selected: ${result[0].name}`);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled');
      } else {
        console.error('Error picking document:', err);
      }
    }
  };
  
  const handleUploadCertification = async () => {
    if (!certType || !selectedFile) {
      Alert.alert('Error', 'Please select certification type and upload document');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const formData = new FormData();
      formData.append('cert_type', certType);
      formData.append('certificate_number', certNumber);
      formData.append('issued_by', issuedBy);
      formData.append('issue_date', issueDate);
      formData.append('expiry_date', expiryDate);
      formData.append('certificate', {
        uri: selectedFile.uri,
        type: selectedFile.type,
        name: selectedFile.name
      } as any);
      
      await axios.post(
        `${API_BASE_URL}/api/civilian-responder/certification`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      Alert.alert(
        'Certification Uploaded!',
        'Your certification is awaiting admin verification. You will be notified once verified.',
        [{ text: 'OK', onPress: () => setStep('completed') }]
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };
  
  const certificationTypes = [
    { label: 'Red Cross First Aid', value: 'red_cross' },
    { label: 'Life Saving Association', value: 'life_saving' },
    { label: 'Heavy Vehicle License', value: 'heavy_vehicle' },
    { label: 'Medical Professional', value: 'medical_professional' },
    { label: 'Fire Safety Training', value: 'fire_safety' },
    { label: 'Search & Rescue Training', value: 'search_rescue' },
    { label: 'Boat Operation License', value: 'boat_license' },
    { label: 'Other', value: 'other' }
  ];
  
  if (step === 'register') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Become a Civilian Responder</Text>
          <Text style={styles.subtitle}>
            Help your community during emergencies as a verified "Good Samaritan"
          </Text>
        </View>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>✅ What You'll Get:</Text>
          <Text style={styles.infoText}>• Access to nearby SOS signals</Text>
          <Text style={styles.infoText}>• Lite version of Responder Dashboard</Text>
          <Text style={styles.infoText}>• Recognition as a Community Hero</Text>
          <Text style={styles.infoText}>• Live tracking and chat with victims</Text>
        </View>
        
        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
          />
          
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
          
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email (optional)"
            keyboardType="email-address"
          />
          
          <Text style={styles.label}>Response Radius (km)</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{radiusKm} km</Text>
            <View style={styles.sliderButtons}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setRadiusKm(Math.max(1, radiusKm - 1))}
              >
                <Text style={styles.sliderButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setRadiusKm(Math.min(20, radiusKm + 1))}
              >
                <Text style={styles.sliderButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.helperText}>
            You'll only see SOS signals within this distance
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Registering...' : 'Register'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
  
  if (step === 'upload_cert') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Certification</Text>
          <Text style={styles.subtitle}>
            Upload your certification to unlock higher emergency levels
          </Text>
        </View>
        
        <View style={styles.levelInfo}>
          <Text style={styles.levelTitle}>SOS Access Levels:</Text>
          <View style={styles.levelItem}>
            <Text style={styles.levelBadge}>Level 1</Text>
            <Text style={styles.levelText}>Food/Water needed (Default)</Text>
          </View>
          <View style={styles.levelItem}>
            <Text style={[styles.levelBadge, styles.level2]}>Level 2</Text>
            <Text style={styles.levelText}>Medical Emergency (Requires medical cert)</Text>
          </View>
          <View style={styles.levelItem}>
            <Text style={[styles.levelBadge, styles.level3]}>Level 3</Text>
            <Text style={styles.levelText}>Life-threatening (Requires rescue cert)</Text>
          </View>
        </View>
        
        <View style={styles.form}>
          <Text style={styles.label}>Certification Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={certType}
              onValueChange={setCertType}
              style={styles.picker}
            >
              {certificationTypes.map(type => (
                <Picker.Item key={type.value} label={type.label} value={type.value} />
              ))}
            </Picker>
          </View>
          
          <Text style={styles.label}>Certificate Number</Text>
          <TextInput
            style={styles.input}
            value={certNumber}
            onChangeText={setCertNumber}
            placeholder="e.g., RC-2024-1234"
          />
          
          <Text style={styles.label}>Issued By</Text>
          <TextInput
            style={styles.input}
            value={issuedBy}
            onChangeText={setIssuedBy}
            placeholder="e.g., Sri Lanka Red Cross"
          />
          
          <Text style={styles.label}>Issue Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={issueDate}
            onChangeText={setIssueDate}
            placeholder="2024-01-01"
          />
          
          <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="2026-01-01"
          />
          
          <Text style={styles.label}>Certificate Document *</Text>
          <TouchableOpacity
            style={styles.fileButton}
            onPress={handleSelectDocument}
          >
            <Text style={styles.fileButtonText}>
              {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose File'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            Upload image or PDF of your certificate (Max 5MB)
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUploadCertification}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Uploading...' : 'Upload Certification'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setStep('completed')}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
  
  // Completed step
  return (
    <View style={styles.completedContainer}>
      <Text style={styles.completedIcon}>🎉</Text>
      <Text style={styles.completedTitle}>Welcome, Civilian Responder!</Text>
      <Text style={styles.completedText}>
        Your account is pending verification. Once verified, you'll be able to respond to SOS signals.
      </Text>
      <Text style={styles.completedText}>
        You can upload additional certifications to unlock higher emergency levels.
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('upload_cert')}
      >
        <Text style={styles.secondaryButtonText}>Upload More Certifications</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#666'
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4
  },
  levelInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  levelBadge: {
    backgroundColor: '#4caf50',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
    width: 80,
    textAlign: 'center'
  },
  level2: {
    backgroundColor: '#ff9800'
  },
  level3: {
    backgroundColor: '#f44336'
  },
  levelText: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  form: {
    marginBottom: 24
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  picker: {
    height: 50
  },
  sliderContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 12
  },
  sliderButton: {
    backgroundColor: '#2196f3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sliderButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16
  },
  fileButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
    borderStyle: 'dashed'
  },
  fileButtonText: {
    color: '#2196f3',
    fontSize: 14,
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  skipButton: {
    padding: 16,
    alignItems: 'center'
  },
  skipButtonText: {
    color: '#2196f3',
    fontSize: 14
  },
  completedContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  completedIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center'
  },
  completedText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center'
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: '600'
  }
});

export default CivilianResponderRegistrationScreen;
