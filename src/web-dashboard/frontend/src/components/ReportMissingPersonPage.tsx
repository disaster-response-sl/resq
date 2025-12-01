import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertTriangle, MapPin, Phone, User, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { extractDataFromPoster, submitMissingPerson } from '../services/missingPersonService';
import { CreateMissingPersonRequest, ExtractedData } from '../types/missingPerson';

const ReportMissingPersonPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  // State Management
  const [step, setStep] = useState<'upload' | 'review' | 'submitted'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [useManualEntry, setUseManualEntry] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState<CreateMissingPersonRequest>({
    full_name: '',
    age: undefined,
    gender: 'male',
    description: '',
    height: '',
    build: undefined,
    complexion: '',
    hair_color: '',
    eye_color: '',
    identifying_marks: '',
    last_seen_date: new Date(),
    last_seen_location: {
      lat: 6.9271,
      lng: 79.8612,
      address: '',
      city: '',
      district: ''
    },
    last_seen_wearing: '',
    circumstances: '',
    reporter_name: user?.name || '',
    reporter_relationship: '',
    reporter_phone: '',
    reporter_email: user?.email || '',
    alternate_contact_name: '',
    alternate_contact_phone: '',
    priority: 'medium',
    is_vulnerable: false,
    medical_conditions: '',
    medication_required: '',
    disaster_related: false,
    police_station: ''
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            last_seen_location: {
              ...prev.last_seen_location,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // STEP 1: Extract data from poster (PROCESSOR - does not save)
  const handleExtractData = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    setExtracting(true);
    
    try {
      const result = await extractDataFromPoster(imageFile);
      
      if (result.success && result.extracted_data) {
        setExtractedData(result.extracted_data);
        
        // Pre-fill form with extracted data
        setFormData(prev => ({
          ...prev,
          full_name: result.extracted_data!.name || prev.full_name,
          age: result.extracted_data!.age || prev.age,
          last_seen_location: {
            ...prev.last_seen_location,
            address: result.extracted_data!.lastSeenLocation || prev.last_seen_location.address
          },
          description: result.extracted_data!.extractedText || prev.description,
          reporter_phone: result.extracted_data!.extractedContacts?.[0]?.phone || prev.reporter_phone,
          reporter_relationship: result.extracted_data!.extractedContacts?.[0]?.relation || prev.reporter_relationship,
          data_source: 'ai_extracted'
        }));
        
        toast.success(`Data extracted! Confidence: ${(result.confidence! * 100).toFixed(0)}%`);
        setStep('review');
      } else {
        // Fallback to manual entry
        toast.error(result.message || 'Extraction failed. Please enter details manually.');
        setUseManualEntry(true);
        setStep('review');
      }
    } catch (error: any) {
      console.error('Extraction error:', error);
      toast.error('Failed to extract data. Please enter manually.');
      setUseManualEntry(true);
      setStep('review');
    } finally {
      setExtracting(false);
    }
  };

  // STEP 2: Submit to MongoDB (SOURCE OF TRUTH)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Please login to submit a report');
      navigate('/login');
      return;
    }

    // Validation
    if (!formData.full_name || !formData.reporter_phone || !formData.circumstances) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const submitData: CreateMissingPersonRequest = {
        ...formData,
        extracted_data: extractedData || undefined,
        data_source: extractedData ? 'ai_extracted' : 'manual',
        photo_urls: imagePreview ? [imagePreview] : []
      };

      const response = await submitMissingPerson(token, submitData);
      
      console.log('✅ Report submitted:', response.data.case_number);
      
      toast.success(
        `Report submitted successfully! Case Number: ${response.data.case_number}. Awaiting verification.`,
        { duration: 5000 }
      );
      
      setStep('submitted');
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  // Skip extraction and go directly to manual entry
  const handleSkipExtraction = () => {
    setUseManualEntry(true);
    setFormData(prev => ({ ...prev, data_source: 'manual' }));
    setStep('review');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => step === 'review' && !submitting ? setStep('upload') : navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Missing Person</h1>
            <p className="text-sm text-gray-600">Help us locate your loved one</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'upload' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {step !== 'upload' ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">Upload Poster</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${
              step === 'review' ? 'text-blue-600' : step === 'submitted' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'review' ? 'bg-blue-600 text-white' : step === 'submitted' ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'
              }`}>
                {step === 'submitted' ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-medium">Review & Submit</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'submitted' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'submitted' ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'
              }`}>
                {step === 'submitted' ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className="font-medium">Submitted</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Upload & Extract */}
        {step === 'upload' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Upload Missing Person Poster (Optional)
              </h2>
              <p className="text-gray-600">
                Our AI will extract details automatically to speed up the process
              </p>
            </div>

            {/* Image Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-96 mx-auto rounded-lg shadow-md"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="poster-upload"
                  />
                  <label
                    htmlFor="poster-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-blue-600 font-medium">Click to upload</span>
                    <span className="text-gray-500 text-sm mt-1">or drag and drop</span>
                    <span className="text-gray-400 text-xs mt-2">PNG, JPG up to 10MB</span>
                  </label>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleExtractData}
                disabled={!imageFile || extracting}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {extracting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting Data...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Extract Data with AI
                  </>
                )}
              </button>
              
              <button
                onClick={handleSkipExtraction}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300"
              >
                Skip & Enter Manually
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Upload a missing person poster image</li>
                  <li>Our AI extracts name, age, location, and contact details</li>
                  <li>Review and edit the extracted information</li>
                  <li>Submit for admin verification before publishing</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Review & Submit Form */}
        {step === 'review' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {extractedData ? '✨ AI-Extracted Data (Please Review)' : '📝 Manual Entry'}
              </h2>
              {extractedData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>Confidence: {(extractedData.confidence * 100).toFixed(0)}%</strong>
                    {' '}- Please verify all information before submitting
                  </p>
                </div>
              )}
              {useManualEntry && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Manual entry mode - Fill in all details carefully
                  </p>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height
                  </label>
                  <input
                    type="text"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 5'8'' or 170 cm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Physical description, clothing, distinguishing features..."
                />
              </div>
            </div>

            {/* Last Seen Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Last Seen Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Seen Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.last_seen_date instanceof Date ? formData.last_seen_date.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, last_seen_date: new Date(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Seen Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_seen_location.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    last_seen_location: { ...formData.last_seen_location, address: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter detailed address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Circumstances <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.circumstances}
                  onChange={(e) => setFormData({ ...formData, circumstances: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe how they went missing..."
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Reporter Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reporter_name}
                    onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reporter_relationship}
                    onChange={(e) => setFormData({ ...formData, reporter_relationship: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Father, Sister, Friend"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.reporter_phone}
                    onChange={(e) => setFormData({ ...formData, reporter_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+94 77 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.reporter_email}
                    onChange={(e) => setFormData({ ...formData, reporter_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Vulnerable Person Checkbox */}
            <div className="border-t pt-6">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_vulnerable}
                  onChange={(e) => setFormData({ ...formData, is_vulnerable: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium text-gray-900">Vulnerable Person</span>
                  <p className="text-sm text-gray-600">
                    Check if elderly, child, or has medical conditions requiring immediate attention
                  </p>
                </div>
              </label>

              {formData.is_vulnerable && (
                <div className="mt-4 ml-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Conditions
                    </label>
                    <textarea
                      rows={2}
                      value={formData.medical_conditions}
                      onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="List any medical conditions..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Medication
                    </label>
                    <input
                      type="text"
                      value={formData.medication_required}
                      onChange={(e) => setFormData({ ...formData, medication_required: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="List medications needed..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="border-t pt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Verification Required:</strong> Your report will be reviewed by our team before being published publicly. You'll be notified once it's verified.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Missing Person Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success */}
        {step === 'submitted' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Report Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Your missing person report is being reviewed by our team. Once verified, it will be published and searchable to help locate your loved one.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>What happens next?</strong><br />
                • Our team will verify the details within 24 hours<br />
                • You'll receive a notification once it's approved<br />
                • The report will then be visible to the public<br />
                • We'll notify you of any sightings or updates
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/missing-persons/search')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Search Missing Persons
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportMissingPersonPage;
