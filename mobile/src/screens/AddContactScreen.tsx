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

type Step = 'input' | 'review' | 'done';

export default function AddContactScreen() {
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

  // Collapsible sections state - Voice Notes expanded by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    voiceNotes: true,
    businessCard: false,
    meetingDetails: false,
    linkedin: false,
    priority: false,
  });

  // Animated values for chevron rotation
  const chevronAnims = useRef({
    voiceNotes: new Animated.Value(1),
    businessCard: new Animated.Value(0),
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
    if (value >= 67) return { label: 'High', color: colors.purple[500] };
    if (value >= 34) return { label: 'Medium', color: colors.cyan[500] };
    return { label: 'Low', color: colors.cyan[700] };
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
              <Icon name="arrow-left" size={24} color={colors.gray[500]} />
            </TouchableOpacity>
            <Text style={styles.reviewHeaderTitle}>Review Contact</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Contact Preview Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewAvatar}>
                <Text style={styles.previewAvatarText}>
                  {extractedData.name?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{extractedData.name || 'Unknown'}</Text>
                {extractedData.role && (
                  <Text style={styles.previewRole}>{extractedData.role}</Text>
                )}
              </View>
            </View>

            <View style={styles.previewDetails}>
              {extractedData.company && (
                <View style={styles.detailRow}>
                  <Icon name="building" size={16} color={colors.gray[400]} />
                  <Text style={styles.detailText}>{extractedData.company}</Text>
                </View>
              )}
              {extractedData.location && (
                <View style={styles.detailRow}>
                  <Icon name="map-pin" size={16} color={colors.gray[400]} />
                  <Text style={styles.detailText}>{extractedData.location}</Text>
                </View>
              )}
              {extractedData.industry && (
                <View style={styles.detailRow}>
                  <Icon name="briefcase" size={16} color={colors.gray[400]} />
                  <Text style={styles.detailText}>{extractedData.industry}</Text>
                </View>
              )}
              {meetingLocation && (
                <View style={styles.detailRow}>
                  <Icon name="navigation" size={16} color={colors.gray[400]} />
                  <Text style={styles.detailText}>Met at: {meetingLocation}</Text>
                </View>
              )}
            </View>

            {/* Priority Bar */}
            <View style={styles.priorityReview}>
              <View style={styles.priorityHeader}>
                <Text style={styles.priorityLabel}>Priority</Text>
                <Text style={[styles.priorityValue, { color: getPriorityInfo(priority).color }]}>
                  {getPriorityInfo(priority).label}
                </Text>
              </View>
              <View style={styles.priorityTrack}>
                <View style={[styles.priorityFill, { width: `${priority}%` }]} />
              </View>
            </View>
          </View>

          {/* Tags */}
          {extractedData.tags && extractedData.tags.length > 0 && (
            <View style={commonStyles.card}>
              <View style={commonStyles.cardHeader}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.purple[500] }]}>
                    <Icon name="zap" size={14} color={colors.white} />
                  </View>
                  <View>
                    <Text style={commonStyles.sectionTitle}>AI-Generated Tags</Text>
                    <Text style={styles.tagCount}>{extractedData.tags.length} tags</Text>
                  </View>
                </View>
              </View>
              <View style={commonStyles.cardContent}>
                <View style={styles.tagsGrid}>
                  {extractedData.tags.map((tag, index) => (
                    <TagBadge key={index} label={tag} variant={getTagVariant(index)} />
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Notes */}
          {transcript && (
            <View style={commonStyles.card}>
              <View style={commonStyles.cardContent}>
                <Text style={commonStyles.label}>Your Notes</Text>
                <Text style={styles.notesText}>"{transcript}"</Text>
              </View>
            </View>
          )}

          {error && (
            <View style={commonStyles.errorContainer}>
              <Text style={commonStyles.errorText}>{error}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={commonStyles.btnSecondary}
              onPress={() => setStep('input')}
            >
              <Text style={commonStyles.btnSecondaryText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.btnPrimary, { flex: 1 }]}
              onPress={saveContact}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Icon name="check" size={18} color={colors.white} />
                  <Text style={commonStyles.btnPrimaryText}>Save Contact</Text>
                </>
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
        style={commonStyles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Add Contact</Text>
          <Text style={styles.pageSubtitle}>Capture and save new connections</Text>
        </View>

        {/* Voice Recording Card */}
        <View style={commonStyles.card}>
          <TouchableOpacity
            style={commonStyles.cardHeader}
            onPress={() => toggleSection('voiceNotes')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#22D3EE' }]}>
                <Icon name="mic" size={18} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={commonStyles.sectionTitle}>Voice Notes</Text>
                <Text style={commonStyles.sectionSubtitle}>Describe how you met</Text>
              </View>
              <View style={[commonStyles.badge, commonStyles.badgeGreen]}>
                <Text style={[commonStyles.badgeText, commonStyles.badgeGreenText]}>Required</Text>
              </View>
              <Animated.View
                style={[
                  styles.chevronContainer,
                  {
                    transform: [{
                      rotate: chevronAnims.voiceNotes.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    }],
                  },
                ]}
              >
                <Icon name="chevron-up" size={18} color="#22D3EE" />
              </Animated.View>
            </View>
          </TouchableOpacity>
          {expandedSections.voiceNotes && (
            <View style={commonStyles.cardContent}>
              <View style={styles.recordingRow}>
                <RecordButton
                  isRecording={isRecording}
                  isProcessing={isTranscribing}
                  onPress={handleRecordPress}
                />
                <View style={styles.recordingInfo}>
                  <Text style={styles.recordingTitle}>
                    {isTranscribing
                      ? 'Transcribing...'
                      : isRecording
                      ? 'Recording...'
                      : 'Tap to record'}
                  </Text>
                  <Text style={styles.recordingSubtitle}>
                    {isRecording ? 'Tap again to stop' : 'Tell me about this person'}
                  </Text>
                </View>
                {recordingPath && !isTranscribing && (
                  <View style={styles.recordingDone}>
                    <Icon name="check" size={14} color={colors.cyan[400]} />
                    <Text style={styles.recordingDoneText}>Done</Text>
                  </View>
                )}
              </View>
              <TextInput
                style={[commonStyles.textarea, { marginTop: 16 }]}
                value={transcript}
                onChangeText={setTranscript}
                placeholder="How did you meet? What do they do? Any notable details..."
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        </View>

        {/* Business Card */}
        <View style={commonStyles.card}>
          <TouchableOpacity
            style={commonStyles.cardHeader}
            onPress={() => toggleSection('businessCard')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#67E8F9' }]}>
                <Icon name="camera" size={16} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={commonStyles.sectionTitle}>Business Card</Text>
                <Text style={commonStyles.sectionSubtitle}>Scan or upload photo</Text>
              </View>
              <View style={commonStyles.badge}>
                <Text style={commonStyles.badgeText}>Optional</Text>
              </View>
              <Animated.View
                style={[
                  styles.chevronContainer,
                  {
                    transform: [{
                      rotate: chevronAnims.businessCard.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    }],
                  },
                ]}
              >
                <Icon name="chevron-up" size={18} color="#67E8F9" />
              </Animated.View>
            </View>
          </TouchableOpacity>
          {expandedSections.businessCard && (
            <View style={commonStyles.cardContent}>
              {imageUri ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: imageUri }} style={styles.cardImage} />
                  <TouchableOpacity style={styles.removeImage} onPress={clearImage}>
                    <Icon name="x" size={16} color={colors.white} />
                  </TouchableOpacity>
                  {isOcrProcessing && (
                    <View style={styles.imageOverlay}>
                      <ActivityIndicator color={colors.cyan[400]} size="large" />
                    </View>
                  )}
                  {cardText && (
                    <View style={styles.ocrPreview}>
                      <Text style={styles.ocrPreviewText} numberOfLines={2}>
                        Extracted: {cardText.slice(0, 50)}...
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={showPicker}>
                  <View style={styles.uploadIcon}>
                    <Icon name="camera" size={26} color={colors.white} />
                  </View>
                  <Text style={styles.uploadText}>Tap to scan or upload</Text>
                  <Text style={styles.uploadHint}>Business card, name badge, etc.</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Meeting Details */}
        <View style={commonStyles.card}>
          <TouchableOpacity
            style={commonStyles.cardHeader}
            onPress={() => toggleSection('meetingDetails')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#A5B4FC' }]}>
                <Icon name="clock" size={16} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={commonStyles.sectionTitle}>Meeting Details</Text>
                <Text style={commonStyles.sectionSubtitle}>When & where you met</Text>
              </View>
              <View style={commonStyles.badge}>
                <Text style={commonStyles.badgeText}>Auto-filled</Text>
              </View>
              <Animated.View
                style={[
                  styles.chevronContainer,
                  {
                    transform: [{
                      rotate: chevronAnims.meetingDetails.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    }],
                  },
                ]}
              >
                <Icon name="chevron-up" size={18} color="#A5B4FC" />
              </Animated.View>
            </View>
          </TouchableOpacity>
          {expandedSections.meetingDetails && (
            <View style={commonStyles.cardContent}>
              {/* Date picker */}
              <View style={styles.inputGroup}>
                <Text style={commonStyles.label}>
                  <Icon name="calendar" size={10} /> Date & Time
                </Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon name="calendar" size={16} color={colors.cyan[400]} />
                  <Text style={styles.dateTimeText}>
                    {meetingDate.toLocaleDateString()} at {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Icon name="chevron-down" size={16} color={colors.gray[500]} />
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
              </View>

              {/* Location */}
              <View style={[styles.inputGroup, { marginTop: 16 }]}>
                <Text style={commonStyles.label}>
                  <Icon name="map-pin" size={10} /> Location
                </Text>
                <View style={styles.locationRow}>
                  <TextInput
                    style={[commonStyles.input, { flex: 1 }]}
                    value={meetingLocation}
                    onChangeText={setMeetingLocation}
                    placeholder="City, venue, or event name..."
                    placeholderTextColor={colors.gray[400]}
                  />
                  <TouchableOpacity
                    style={commonStyles.btnIcon}
                    onPress={getCurrentLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <ActivityIndicator size="small" color={colors.gray[500]} />
                    ) : (
                      <Icon name="navigation" size={16} color={colors.gray[500]} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* LinkedIn */}
        <View style={commonStyles.card}>
          <TouchableOpacity
            style={commonStyles.cardHeader}
            onPress={() => toggleSection('linkedin')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#C084FC' }]}>
                <Icon name="linkedin" size={14} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={commonStyles.sectionTitle}>LinkedIn Profile</Text>
                <Text style={commonStyles.sectionSubtitle}>Add their profile link</Text>
              </View>
              <View style={commonStyles.badge}>
                <Text style={commonStyles.badgeText}>Optional</Text>
              </View>
              <Animated.View
                style={[
                  styles.chevronContainer,
                  {
                    transform: [{
                      rotate: chevronAnims.linkedin.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    }],
                  },
                ]}
              >
                <Icon name="chevron-up" size={18} color="#C084FC" />
              </Animated.View>
            </View>
          </TouchableOpacity>
          {expandedSections.linkedin && (
            <View style={commonStyles.cardContent}>
              <TextInput
                style={commonStyles.input}
                value={linkedinUrl}
                onChangeText={setLinkedinUrl}
                placeholder="linkedin.com/in/username"
                placeholderTextColor={colors.gray[400]}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          )}
        </View>

        {/* Priority */}
        <View style={commonStyles.card}>
          <TouchableOpacity
            style={commonStyles.cardHeader}
            onPress={() => toggleSection('priority')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#A855F7' }]}>
                <Icon name="star" size={14} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={commonStyles.sectionTitle}>Priority Level</Text>
                <Text style={commonStyles.sectionSubtitle}>How important is this contact?</Text>
              </View>
              <Text style={[styles.priorityBadge, { color: getPriorityInfo(priority).color }]}>
                {getPriorityInfo(priority).label}
              </Text>
              <Animated.View
                style={[
                  styles.chevronContainer,
                  {
                    transform: [{
                      rotate: chevronAnims.priority.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    }],
                  },
                ]}
              >
                <Icon name="chevron-up" size={18} color="#A855F7" />
              </Animated.View>
            </View>
          </TouchableOpacity>
          {expandedSections.priority && (
            <View style={commonStyles.cardContent}>
              <PrioritySlider value={priority} onChange={setPriority} />
            </View>
          )}
        </View>

        {/* Error message */}
        {(error || audioError || imageError) && (
          <View style={commonStyles.errorContainer}>
            <Text style={commonStyles.errorText}>{error || audioError || imageError}</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!transcript && !cardText) && commonStyles.btnDisabled,
          ]}
          onPress={processAndExtract}
          disabled={isProcessing || isTranscribing || (!transcript && !cardText)}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.submitButtonText}>Analyzing...</Text>
            </>
          ) : (
            <>
              <Icon name="zap" size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>Extract & Generate Tags</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  titleSection: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[500],
    marginTop: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  reviewHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  recordingSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  recordingDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cyan[900],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cyan[700],
  },
  recordingDoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.cyan[400],
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.purple[500],
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple[900] + '30',
  },
  uploadText: {
    fontSize: 15,
    color: colors.purple[300],
    marginTop: 12,
    fontWeight: '600',
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.purple[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  imagePreview: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  removeImage: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
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
  ocrPreview: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ocrPreviewText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {},
  locationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: colors.gray[800],
    borderWidth: 1.5,
    borderColor: colors.gray[700],
    borderRadius: 14,
    gap: 12,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  priorityBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  // Review screen styles
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.primary,
    gap: 16,
  },
  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  previewRole: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  previewDetails: {
    padding: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  priorityReview: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priorityLabel: {
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '500',
  },
  priorityValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  priorityTrack: {
    height: 10,
    backgroundColor: colors.gray[800],
    borderRadius: 5,
    overflow: 'hidden',
  },
  priorityFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  tagCount: {
    fontSize: 12,
    color: colors.cyan[400],
    fontWeight: '500',
    marginLeft: 8,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.gray[600],
    fontStyle: 'italic',
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  successHighlight: {
    fontWeight: '700',
    color: colors.cyan[400],
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
});
