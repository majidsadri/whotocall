import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import ScreenWrapper from '../components/ScreenWrapper';
import {
  BusinessCardPreview,
  CardEditForm,
  TemplateSelector,
  ShareModal,
} from '../components/businessCard';
import { useBusinessCard } from '../hooks/useBusinessCard';
import { useImagePicker } from '../hooks/useImagePicker';
import { useAuth } from '../context/AuthContext';
import { TemplateId } from '../types/businessCard';
import { colors } from '../styles/colors';
import { commonStyles } from '../styles/common';

export default function MeScreen() {
  const { user } = useAuth();
  const {
    card,
    isLoading,
    isSaving,
    error,
    hasChanges,
    formData,
    updateField,
    saveCard,
    uploadAvatar,
    generateVCard,
    getCardShareUrl,
  } = useBusinessCard();

  const { showPicker, pickFromGallery, pickFromCamera } = useImagePicker();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handlePickImage = useCallback(() => {
    Alert.alert(
      'Change Photo',
      'Choose how to add a profile photo',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const uri = await pickFromCamera();
            if (uri) {
              const avatarUrl = await uploadAvatar(uri);
              if (avatarUrl) {
                updateField('avatar_url', avatarUrl);
              }
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const uri = await pickFromGallery();
            if (uri) {
              const avatarUrl = await uploadAvatar(uri);
              if (avatarUrl) {
                updateField('avatar_url', avatarUrl);
              }
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }, [pickFromCamera, pickFromGallery, uploadAvatar, updateField]);

  const handleSave = useCallback(async () => {
    const success = await saveCard();
    if (success) {
      setIsEditMode(false);
      Alert.alert('Success', 'Your business card has been saved!');
    }
  }, [saveCard]);

  const handleShare = useCallback(() => {
    if (!formData.full_name.trim()) {
      Alert.alert('Add Name', 'Please add your name before sharing.');
      return;
    }
    setShowShareModal(true);
  }, [formData.full_name]);

  const handleExportVCard = useCallback(async () => {
    try {
      const vcard = await generateVCard();
      if (vcard) {
        // For now, just show the vCard content - in production, would share as file
        Alert.alert('vCard Generated', 'Your vCard is ready to share.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not generate vCard');
    }
  }, [generateVCard]);

  const handleTemplateChange = useCallback((templateId: TemplateId) => {
    updateField('template_id', templateId);
  }, [updateField]);

  // Loading state
  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple[500]} />
          <Text style={styles.loadingText}>Loading your card...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <ScreenWrapper>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="user" size={48} color={colors.gray[500]} />
          </View>
          <Text style={styles.emptyTitle}>Sign in to create your card</Text>
          <Text style={styles.emptySubtitle}>
            Connect with LinkedIn to create and share your digital business card
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const shareUrl = getCardShareUrl();

  return (
    <ScreenWrapper>
      <ScrollView
        style={commonStyles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My Card</Text>
          <Text style={styles.pageSubtitle}>Your digital business card</Text>
        </View>

        {/* Card Preview */}
        <View style={styles.previewSection}>
          <BusinessCardPreview data={formData} size="large" />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setIsEditMode(!isEditMode)}
          >
            <Icon name={isEditMode ? 'x' : 'edit-2'} size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>
              {isEditMode ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
            disabled={!formData.full_name.trim()}
          >
            <Icon name="share-2" size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Mode */}
        {isEditMode && (
          <View style={commonStyles.card}>
            <View style={commonStyles.cardContent}>
              {/* Template Selector */}
              <TemplateSelector
                selectedTemplate={formData.template_id || 'classic'}
                onSelectTemplate={handleTemplateChange}
              />

              <View style={styles.divider} />

              {/* Edit Form */}
              <CardEditForm
                data={formData}
                onUpdateField={updateField}
                onPickImage={handlePickImage}
              />

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  commonStyles.btnPrimary,
                  styles.saveButton,
                  (!hasChanges || isSaving) && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Icon name="check" size={18} color={colors.white} />
                    <Text style={commonStyles.btnPrimaryText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tips Card */}
        {!isEditMode && !card && (
          <View style={[commonStyles.card, styles.tipsCard]}>
            <View style={styles.tipsHeader}>
              <Icon name="zap" size={20} color={colors.cyan[400]} />
              <Text style={styles.tipsTitle}>Get Started</Text>
            </View>
            <Text style={styles.tipsText}>
              Tap "Edit" to customize your business card. Add your contact details,
              choose a template, and share it with anyone instantly.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Share Modal */}
      {shareUrl && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={shareUrl}
          cardName={formData.full_name}
          onExportVCard={handleExportVCard}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[400],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray[800],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.gray[400],
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    marginTop: 8,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    color: colors.gray[400],
    marginTop: 4,
  },
  previewSection: {
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  editButton: {
    backgroundColor: colors.gray[700],
  },
  shareButton: {
    backgroundColor: colors.purple[600],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.red[900] + '40',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.red[400],
    flex: 1,
  },
  saveButton: {
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  tipsCard: {
    backgroundColor: colors.cyan[900] + '30',
    borderColor: colors.cyan[800],
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cyan[400],
  },
  tipsText: {
    fontSize: 14,
    color: colors.gray[300],
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});
