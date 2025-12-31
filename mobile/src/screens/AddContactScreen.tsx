import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootTabParamList } from '../navigation/AppNavigator';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Feather';

import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useImagePicker } from '../hooks/useImagePicker';
import { useLocation } from '../hooks/useLocation';
import RecordButton from '../components/RecordButton';
import PrioritySlider from '../components/PrioritySlider';
import TagBadge, { getTagVariant } from '../components/TagBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ScreenWrapper from '../components/ScreenWrapper';
import { colors } from '../styles/colors';
import { commonStyles } from '../styles/common';
import * as api from '../services/api';
import { ExtractedTags } from '../types';

type AddContactRouteProp = RouteProp<RootTabParamList, 'Add'>;

type Step = 'input' | 'review' | 'done';

export default function AddContactScreen() {
  const route = useRoute<AddContactRouteProp>();
  const [step, setStep] = useState<Step>('input');
  const [transcript, setTranscript] = useState('');
  const [cardText, setCardText] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState(50);
  const [extractedData, setExtractedData] = useState<ExtractedTags | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle deep link prefill data
  useEffect(() => {
    const params = route.params;
    if (params?.name) {
      // Build context from shared card data
      const contextParts = [`Received shared business card from ${params.name}.`];
      if (params.title) contextParts.push(`Title: ${params.title}.`);
      if (params.company) contextParts.push(`Company: ${params.company}.`);
      if (params.email) contextParts.push(`Email: ${params.email}.`);
      if (params.linkedin) contextParts.push(`LinkedIn profile available.`);
      contextParts.push('This is a shared contact from Reachr app.');
      const context = contextParts.join(' ');

      setTranscript(context);
      if (params.linkedin) {
        setLinkedinUrl(params.linkedin);
      }

      // Set initial data and go to review
      const initialData: ExtractedTags = {
        name: params.name,
        email: params.email || undefined,
        phone: params.phone || undefined,
        role: params.title || undefined,
        company: params.company || undefined,
        tags: ['shared contact'],
      };
      setExtractedData(initialData);
      setStep('review');

      // Call AI to extract proper tags in background
      const extractProperTags = async () => {
        try {
          setIsProcessing(true);
          const aiData = await api.extractTags(context);
          // Merge AI tags with shared contact tag
          const mergedData: ExtractedTags = {
            name: params.name,
            email: params.email || aiData.email || undefined,
            phone: params.phone || aiData.phone || undefined,
            role: params.title || aiData.role || undefined,
            company: params.company || aiData.company || undefined,
            industry: aiData.industry || undefined,
            location: aiData.location || undefined,
            tags: [...new Set(['shared contact', ...(aiData.tags || [])])],
          };
          setExtractedData(mergedData);
        } catch (err) {
          console.log('Tag extraction failed, using basic tags');
        } finally {
          setIsProcessing(false);
        }
      };
      extractProperTags();
    }
  }, [route.params]);

  // Collapsible sections state - Business Card expanded by default (it's required)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    businessCard: true,
    voiceNotes: true,
    meetingDetails: false,
    linkedin: false,
    priority: false,
  });

  // Animated values for chevron rotation
  const chevronAnims = useRef({
    businessCard: new Animated.Value(1),
    voiceNotes: new Animated.Value(1),
    meetingDetails: new Animated.Value(0),
    linkedin: new Animated.Value(0),
    priority: new Animated.Value(0),
  }).current;

  // Toggle section expansion
  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const isExpanding = !expandedSections[section];
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));

    // Animate chevron rotation
    Animated.timing(chevronAnims[section as keyof typeof chevronAnims], {
      toValue: isExpanding ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const {
    isRecording,
    recordingPath,
    startRecording,
    stopRecording,
    error: audioError,
    duration: recordingDuration,
  } = useAudioRecorder();

  const {
    imageUri,
    isLoading: imageLoading,
    error: imageError,
    showPicker,
    clearImage,
  } = useImagePicker();

  const {
    address: geoAddress,
    isLoading: locationLoading,
    getCurrentLocation,
  } = useLocation();

  // Get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Update meeting location when geolocation resolves
  useEffect(() => {
    if (geoAddress && !meetingLocation) {
      setMeetingLocation(geoAddress);
    }
  }, [geoAddress]);

  // Handle recording toggle
  const handleRecordPress = async () => {
    if (isRecording) {
      const path = await stopRecording();
      if (path) {
        // Transcribe the audio
        setIsTranscribing(true);
        try {
          const result = await api.transcribeAudio(path);
          if (result.text) {
            setTranscript((prev) => (prev ? `${prev} ${result.text}` : result.text));
          }
        } catch (err) {
          console.error('Transcription error:', err);
          setError('Failed to transcribe audio');
        } finally {
          setIsTranscribing(false);
        }
      }
    } else {
      await startRecording();
    }
  };

  // Handle image selection and OCR
  useEffect(() => {
    if (imageUri && !isOcrProcessing) {
      processImage(imageUri);
    }
  }, [imageUri]);

  const processImage = async (uri: string) => {
    setIsOcrProcessing(true);
    setError(null);
    try {
      const result = await api.extractCardText(uri);
      if (result.text) {
        setCardText(result.text);
      }
    } catch (err) {
      console.error('OCR error:', err);
      setError('Failed to extract text from image');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Process and extract tags
  const processAndExtract = async () => {
    if (!transcript && !cardText) {
      Alert.alert('Missing Input', 'Please record a voice note or scan a business card.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const data = await api.extractTags(transcript, cardText);
      setExtractedData(data);
      setStep('review');
    } catch (err) {
      console.error('Extraction error:', err);
      setError('Failed to extract information');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save contact
  const saveContact = async () => {
    if (!extractedData) return;

    setIsProcessing(true);
    try {
      await api.createContact({
        ...extractedData,
        linkedin_url: linkedinUrl || undefined,
        raw_context: transcript,
        met_date: meetingDate.toISOString().split('T')[0],
        meeting_location: meetingLocation || undefined,
        priority,
      });
      setStep('done');
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save contact');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset form
  const reset = () => {
    setStep('input');
    setTranscript('');
    setCardText('');
    setLinkedinUrl('');
    setMeetingDate(new Date());
    setPriority(50);
    setExtractedData(null);
    setError(null);
    clearImage();
    getCurrentLocation();
  };

  // Get priority info
  const getPriorityInfo = (value: number) => {
    if (value >= 67) return { label: 'High', color: colors.green[600] };
    if (value >= 34) return { label: 'Medium', color: colors.green[500] };
    return { label: 'Low', color: colors.green[400] };
  };

  // Success screen
  if (step === 'done') {
    return (
      <ScreenWrapper>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={40} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Contact Saved!</Text>
          <Text style={styles.successSubtitle}>
            Added to your network with{' '}
            <Text style={styles.successHighlight}>
              {extractedData?.tags?.length || 0} searchable tags
            </Text>
          </Text>
          <TouchableOpacity style={styles.successButton} onPress={reset}>
            <Icon name="plus" size={18} color={colors.white} />
            <Text style={styles.successButtonText}>Add Another Contact</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // Review screen
  if (step === 'review' && extractedData) {
    return (
      <ScreenWrapper>
        <ScrollView style={commonStyles.container} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.reviewHeader}>
            <TouchableOpacity onPress={() => setStep('input')}>
              <Icon name="arrow-left" size={20} color={colors.gray[500]} />
            </TouchableOpacity>
            <Text style={styles.reviewHeaderTitle}>Review</Text>
            <View style={{ width: 20 }} />
          </View>

          {/* Contact Info */}
          <View style={styles.reviewSection}>
            <View style={styles.reviewAvatar}>
              <Text style={styles.reviewAvatarText}>
                {extractedData.name?.charAt(0) || '?'}
              </Text>
            </View>
            <Text style={styles.reviewName}>{extractedData.name || 'Unknown'}</Text>
            {extractedData.role && <Text style={styles.reviewRole}>{extractedData.role}</Text>}
          </View>

          <View style={styles.divider} />

          {/* Details */}
          <View style={styles.reviewDetails}>
            {extractedData.company && (
              <View style={styles.reviewDetailRow}>
                <Icon name="briefcase" size={14} color={colors.gray[400]} />
                <Text style={styles.reviewDetailText}>{extractedData.company}</Text>
              </View>
            )}
            {extractedData.location && (
              <View style={styles.reviewDetailRow}>
                <Icon name="map-pin" size={14} color={colors.gray[400]} />
                <Text style={styles.reviewDetailText}>{extractedData.location}</Text>
              </View>
            )}
            {meetingLocation && (
              <View style={styles.reviewDetailRow}>
                <Icon name="navigation" size={14} color={colors.gray[400]} />
                <Text style={styles.reviewDetailText}>{meetingLocation}</Text>
              </View>
            )}
            <View style={styles.reviewDetailRow}>
              <Icon name="star" size={14} color={getPriorityInfo(priority).color} />
              <Text style={[styles.reviewDetailText, { color: getPriorityInfo(priority).color }]}>
                {getPriorityInfo(priority).label} priority
              </Text>
            </View>
          </View>

          {/* Tags */}
          {extractedData.tags && extractedData.tags.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.reviewTags}>
                <Text style={styles.reviewTagsLabel}>Tags</Text>
                <View style={styles.tagsGrid}>
                  {extractedData.tags.map((tag, index) => (
                    <TagBadge key={index} label={tag} variant={getTagVariant(index)} />
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Notes */}
          {transcript && (
            <>
              <View style={styles.divider} />
              <View style={styles.reviewNotes}>
                <Text style={styles.reviewNotesLabel}>Notes</Text>
                <Text style={styles.notesText}>"{transcript}"</Text>
              </View>
            </>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Actions */}
          <View style={styles.reviewActions}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('input')}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isProcessing && styles.submitButtonDisabled]}
              onPress={saveContact}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // Input screen
  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Curve Spacer */}
        <View style={styles.topSpacer}>
          <View style={styles.topCurve} />
        </View>

        {/* Business Card - Primary section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('businessCard')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionIcon}>
              <Icon name="camera" size={18} color={colors.white} />
            </View>
            <Text style={styles.sectionTitle}>Scan Card</Text>
            <Text style={styles.requiredBadge}>Required</Text>
            <Animated.View style={{ transform: [{ rotate: chevronAnims.businessCard.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
              <Icon name="chevron-up" size={18} color={colors.gray[400]} />
            </Animated.View>
          </TouchableOpacity>
          {expandedSections.businessCard && (
            <View style={styles.sectionContent}>
              {imageUri ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: imageUri }} style={styles.cardImage} />
                  <TouchableOpacity style={styles.removeImage} onPress={clearImage}>
                    <Icon name="x" size={16} color={colors.white} />
                  </TouchableOpacity>
                  {isOcrProcessing && (
                    <View style={styles.imageOverlay}>
                      <ActivityIndicator color={colors.gray[600]} size="large" />
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={showPicker}>
                  <View style={styles.uploadIconContainer}>
                    <Icon name="camera" size={28} color={colors.white} />
                  </View>
                  <Text style={styles.uploadText}>Scan Business or Reachr Card</Text>
                  <Text style={styles.uploadHint}>Take a photo or choose from gallery</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Voice Recording */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('voiceNotes')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionIcon}>
              <Icon name="mic" size={18} color={colors.white} />
            </View>
            <Text style={styles.sectionTitle}>Voice Notes</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
            <Animated.View style={{ transform: [{ rotate: chevronAnims.voiceNotes.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
              <Icon name="chevron-up" size={18} color={colors.gray[400]} />
            </Animated.View>
          </TouchableOpacity>
          {expandedSections.voiceNotes && (
            <View style={styles.sectionContent}>
              <View style={styles.recordingRow}>
                <RecordButton
                  isRecording={isRecording}
                  isProcessing={isTranscribing}
                  onPress={handleRecordPress}
                />
                <View style={styles.recordingInfo}>
                  <Text style={styles.recordingTitle}>
                    {isTranscribing ? 'Transcribing...' : isRecording ? `Recording ${recordingDuration}` : 'Tap to record'}
                  </Text>
                  <Text style={styles.recordingSubtitle}>
                    {isRecording ? 'Tap again to stop' : 'Describe how you met'}
                  </Text>
                </View>
                {recordingPath && !isTranscribing && (
                  <Icon name="check-circle" size={18} color={colors.green[500]} />
                )}
              </View>
              <TextInput
                style={styles.textArea}
                value={transcript}
                onChangeText={setTranscript}
                placeholder="Notes about this person..."
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={3}
              />
            </View>
          )}
        </View>

        {/* Meeting Details */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('meetingDetails')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionIcon}>
              <Icon name="calendar" size={18} color={colors.white} />
            </View>
            <Text style={styles.sectionTitle}>When & Where</Text>
            <Text style={styles.optionalBadge}>Auto-filled</Text>
            <Animated.View style={{ transform: [{ rotate: chevronAnims.meetingDetails.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
              <Icon name="chevron-up" size={18} color={colors.gray[400]} />
            </Animated.View>
          </TouchableOpacity>
          {expandedSections.meetingDetails && (
            <View style={styles.sectionContent}>
              <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
                <Icon name="clock" size={18} color={colors.gray[400]} />
                <Text style={styles.inputText}>
                  {meetingDate.toLocaleDateString()} at {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={meetingDate}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setMeetingDate(date);
                  }}
                  themeVariant="dark"
                />
              )}
              <View style={styles.inputRow}>
                <Icon name="map-pin" size={18} color={colors.gray[400]} />
                <TextInput
                  style={styles.inlineInput}
                  value={meetingLocation}
                  onChangeText={setMeetingLocation}
                  placeholder="Location..."
                  placeholderTextColor={colors.gray[400]}
                />
                <TouchableOpacity onPress={getCurrentLocation} disabled={locationLoading}>
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={colors.gray[400]} />
                  ) : (
                    <Icon name="navigation" size={18} color={colors.gray[600]} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* LinkedIn */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('linkedin')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionIcon}>
              <Icon name="linkedin" size={18} color={colors.white} />
            </View>
            <Text style={styles.sectionTitle}>LinkedIn</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
            <Animated.View style={{ transform: [{ rotate: chevronAnims.linkedin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
              <Icon name="chevron-up" size={18} color={colors.gray[400]} />
            </Animated.View>
          </TouchableOpacity>
          {expandedSections.linkedin && (
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <Icon name="link" size={18} color={colors.gray[400]} />
                <TextInput
                  style={styles.inlineInput}
                  value={linkedinUrl}
                  onChangeText={setLinkedinUrl}
                  placeholder="linkedin.com/in/username"
                  placeholderTextColor={colors.gray[400]}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
          )}
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('priority')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionIcon}>
              <Icon name="star" size={18} color={colors.white} />
            </View>
            <Text style={styles.sectionTitle}>Priority</Text>
            <Text style={[styles.priorityValue, { color: getPriorityInfo(priority).color }]}>
              {getPriorityInfo(priority).label}
            </Text>
            <Animated.View style={{ transform: [{ rotate: chevronAnims.priority.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
              <Icon name="chevron-up" size={18} color={colors.gray[400]} />
            </Animated.View>
          </TouchableOpacity>
          {expandedSections.priority && (
            <View style={styles.sectionContent}>
              <PrioritySlider value={priority} onChange={setPriority} />
            </View>
          )}
        </View>

        {/* Error message */}
        {(error || audioError || imageError) && (
          <Text style={styles.errorText}>{error || audioError || imageError}</Text>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!transcript && !cardText) && styles.submitButtonDisabled]}
          onPress={processAndExtract}
          disabled={isProcessing || isTranscribing || (!transcript && !cardText)}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Icon name="zap" size={16} color={colors.white} />
              <Text style={styles.submitButtonText}>Generate Tags</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  topSpacer: {
    height: 24,
    marginBottom: 8,
    overflow: 'hidden',
  },
  topCurve: {
    position: 'absolute',
    top: -40,
    left: -20,
    right: -20,
    height: 60,
    backgroundColor: colors.gray[800],
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  section: {
    marginVertical: 6,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.gray[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[800],
  },
  sectionContent: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    borderLeftWidth: 3,
    borderLeftColor: colors.green[400],
    backgroundColor: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: 6,
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.green[600],
    backgroundColor: colors.green[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[400],
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },
  recordingSubtitle: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 3,
  },
  textArea: {
    marginTop: 16,
    fontSize: 15,
    color: colors.gray[800],
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    borderRadius: 16,
    backgroundColor: colors.gray[50],
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.gray[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadText: {
    fontSize: 16,
    color: colors.gray[800],
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 14,
    color: colors.gray[400],
  },
  imagePreview: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  removeImage: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
  },
  inlineInput: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[800],
    padding: 0,
  },
  priorityValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: colors.red[500],
    textAlign: 'center',
    marginTop: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.green[600],
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 28,
    shadowColor: colors.green[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray[200],
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  // Review screen styles
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  reviewHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
  },
  reviewSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  reviewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reviewAvatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.white,
  },
  reviewName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
  },
  reviewRole: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  reviewDetails: {
    paddingVertical: 16,
    gap: 12,
  },
  reviewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewDetailText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  reviewTags: {
    paddingVertical: 16,
  },
  reviewTagsLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  reviewNotes: {
    paddingVertical: 16,
  },
  reviewNotesLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  notesText: {
    fontSize: 13,
    color: colors.gray[500],
    fontStyle: 'italic',
    lineHeight: 18,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.green[600],
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.white,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  successHighlight: {
    fontWeight: '600',
    color: colors.green[600],
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.green[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  successButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
