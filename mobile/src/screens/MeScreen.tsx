import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import ScreenWrapper from '../components/ScreenWrapper';
import {
  BusinessCardPreview,
  CardEditForm,
  TemplateSelector,
  ShareModal,
  CardCarousel,
  AddCardModal,
  CardScanner,
  ScannedCardPreview,
} from '../components/businessCard';
import { useBusinessCards } from '../hooks/useBusinessCards';
import { useImagePicker } from '../hooks/useImagePicker';
import { useAuth } from '../context/AuthContext';
import { useLoginModal } from '../context/LoginModalContext';
import { TemplateId, BusinessCardInput } from '../types/businessCard';
import { colors } from '../styles/colors';
import { commonStyles } from '../styles/common';

export default function MeScreen() {
  const { user } = useAuth();
  const { openLoginModal } = useLoginModal();
  const {
    cards,
    selectedCard,
    selectedCardIndex,
    isLoading,
    isSaving,
    error,
    selectCardByIndex,
    createDigitalCard,
    createScannedCard,
    updateCard,
    deleteCard,
    setPrimaryCard,
    getCardShareUrl,
    generateVCard,
    uploadAvatar,
    refreshCards,
  } = useBusinessCards();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshCards();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCards]);

  const { pickFromGallery, pickFromCamera } = useImagePicker();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<BusinessCardInput | null>(null);

  // Start editing current card
  const handleStartEdit = useCallback(() => {
    if (selectedCard && selectedCard.card_type === 'digital') {
      setEditFormData({
        full_name: selectedCard.full_name,
        email: selectedCard.email || '',
        phone: selectedCard.phone || '',
        title: selectedCard.title || '',
        company: selectedCard.company || '',
        website: selectedCard.website || '',
        linkedin_url: selectedCard.linkedin_url || '',
        avatar_url: selectedCard.avatar_url || '',
        template_id: selectedCard.template_id,
        accent_color: selectedCard.accent_color,
      });
      setIsEditMode(true);
    }
  }, [selectedCard]);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditFormData(null);
  }, []);

  const updateEditField = useCallback((field: keyof BusinessCardInput, value: string) => {
    setEditFormData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

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
                updateEditField('avatar_url', avatarUrl);
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
                updateEditField('avatar_url', avatarUrl);
              }
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }, [pickFromCamera, pickFromGallery, uploadAvatar, updateEditField]);

  const handleSave = useCallback(async () => {
    if (!selectedCard || !editFormData) return;

    const success = await updateCard(selectedCard.id, editFormData);
    if (success) {
      setIsEditMode(false);
      setEditFormData(null);
      Alert.alert('Success', 'Your business card has been saved!');
    }
  }, [selectedCard, editFormData, updateCard]);

  const handleShare = useCallback(() => {
    if (!selectedCard?.full_name?.trim()) {
      Alert.alert('Add Name', 'Please add a name before sharing.');
      return;
    }
    setShowShareModal(true);
  }, [selectedCard]);

  const handleExportVCard = useCallback(async () => {
    try {
      const vcard = await generateVCard(selectedCard?.id);
      if (vcard) {
        Alert.alert('vCard Generated', 'Your vCard is ready to share.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not generate vCard');
    }
  }, [generateVCard, selectedCard]);

  const handleTemplateChange = useCallback((templateId: TemplateId) => {
    updateEditField('template_id', templateId);
  }, [updateEditField]);

  const handleAddCard = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleCreateDigital = useCallback(async () => {
    // Create a new blank digital card
    const newCard = await createDigitalCard({
      full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'New Card',
      email: user?.email || '',
      phone: '',
      title: '',
      company: '',
      website: '',
      linkedin_url: '',
      avatar_url: user?.user_metadata?.avatar_url || '',
      template_id: 'gradient',
    });

    if (newCard) {
      // Start editing the new card
      setEditFormData({
        full_name: newCard.full_name,
        email: newCard.email || '',
        phone: newCard.phone || '',
        title: newCard.title || '',
        company: newCard.company || '',
        website: newCard.website || '',
        linkedin_url: newCard.linkedin_url || '',
        avatar_url: newCard.avatar_url || '',
        template_id: newCard.template_id,
        accent_color: newCard.accent_color,
      });
      setIsEditMode(true);
    }
  }, [createDigitalCard, user]);

  const handleScanCard = useCallback(() => {
    setShowScanner(true);
  }, []);

  const handleSaveScannedCard = useCallback(async (imageUrl: string, label: string) => {
    await createScannedCard({
      card_label: label,
      scanned_image_url: imageUrl,
    });
  }, [createScannedCard]);

  const handleSetPrimary = useCallback(async () => {
    if (!selectedCard || selectedCard.is_primary) return;

    Alert.alert(
      'Set as Primary',
      'Make this your primary card? It will be used for quick sharing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Primary',
          onPress: async () => {
            const success = await setPrimaryCard(selectedCard.id);
            if (success) {
              Alert.alert('Success', 'Primary card updated!');
            }
          },
        },
      ]
    );
  }, [selectedCard, setPrimaryCard]);

  const handleDeleteCard = useCallback(async () => {
    if (!selectedCard) return;

    const cardName = selectedCard.card_label || selectedCard.full_name || 'this card';

    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete "${cardName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCard(selectedCard.id);
            if (success) {
              setIsEditMode(false);
              setEditFormData(null);
            }
          },
        },
      ]
    );
  }, [selectedCard, deleteCard]);

  // Loading state
  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple[500]} />
          <Text style={styles.loadingText}>Loading your cards...</Text>
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
          <Text style={styles.emptyTitle}>Sign in to create your cards</Text>
          <Text style={styles.emptySubtitle}>
            Connect with LinkedIn to create and share your digital business cards
          </Text>
          <TouchableOpacity style={styles.signInButton} onPress={openLoginModal}>
            <Icon name="log-in" size={20} color={colors.white} />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const shareUrl = getCardShareUrl(selectedCard?.id);
  const isScannedCard = selectedCard?.card_type === 'scanned';
  const formData = editFormData || (selectedCard ? {
    full_name: selectedCard.full_name,
    email: selectedCard.email || '',
    phone: selectedCard.phone || '',
    title: selectedCard.title || '',
    company: selectedCard.company || '',
    website: selectedCard.website || '',
    linkedin_url: selectedCard.linkedin_url || '',
    avatar_url: selectedCard.avatar_url || '',
    template_id: selectedCard.template_id,
    accent_color: selectedCard.accent_color,
  } : {
    full_name: '',
    email: '',
    template_id: 'gradient' as TemplateId,
  });

  return (
    <ScreenWrapper>
      <ScrollView
        style={commonStyles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.purple[500]}
            colors={[colors.purple[500]]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My Cards</Text>
          <Text style={styles.pageSubtitle}>
            {cards.length === 0
              ? 'Create your first business card'
              : `${cards.length} card${cards.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Card Carousel */}
        <CardCarousel
          cards={cards}
          selectedIndex={selectedCardIndex}
          onSelectIndex={selectCardByIndex}
          onAddCard={handleAddCard}
        />

        {/* Selected Card Info */}
        {selectedCard && (
          <View style={styles.cardInfoSection}>
            <View style={styles.cardInfoHeader}>
              <Text style={styles.cardInfoName} numberOfLines={1}>
                {selectedCard.card_label || selectedCard.full_name || 'Untitled Card'}
              </Text>
              {selectedCard.is_primary && (
                <View style={styles.primaryTag}>
                  <Icon name="star" size={12} color={colors.yellow[400]} />
                  <Text style={styles.primaryTagText}>Primary</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardInfoType}>
              {isScannedCard ? 'Scanned Card' : 'Digital Card'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {selectedCard && !isEditMode && (
          <View style={styles.actionRow}>
            {!isScannedCard && (
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={handleStartEdit}
              >
                <Icon name="edit-2" size={18} color={colors.white} />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
            >
              <Icon name="share-2" size={18} color={colors.white} />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* More Actions */}
        {selectedCard && !isEditMode && (
          <View style={styles.moreActionsRow}>
            {!selectedCard.is_primary && (
              <TouchableOpacity
                style={styles.moreActionButton}
                onPress={handleSetPrimary}
              >
                <Icon name="star" size={16} color={colors.gray[400]} />
                <Text style={styles.moreActionText}>Set Primary</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.moreActionButton}
              onPress={handleDeleteCard}
            >
              <Icon name="trash-2" size={16} color={colors.red[400]} />
              <Text style={[styles.moreActionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Edit Mode for Digital Cards */}
        {isEditMode && !isScannedCard && editFormData && (
          <View style={commonStyles.card}>
            <View style={commonStyles.cardContent}>
              {/* Template Selector */}
              <TemplateSelector
                selectedTemplate={editFormData.template_id || 'gradient'}
                onSelectTemplate={handleTemplateChange}
              />

              <View style={styles.divider} />

              {/* Edit Form */}
              <CardEditForm
                data={editFormData}
                onUpdateField={updateEditField}
                onPickImage={handlePickImage}
              />

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Save/Cancel Buttons */}
              <View style={styles.editButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelEditText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    commonStyles.btnPrimary,
                    styles.saveButton,
                    isSaving && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={isSaving}
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
          </View>
        )}

        {/* Tips Card for new users */}
        {cards.length === 0 && (
          <View style={[commonStyles.card, styles.tipsCard]}>
            <View style={styles.tipsHeader}>
              <Icon name="zap" size={20} color={colors.cyan[400]} />
              <Text style={styles.tipsTitle}>Get Started</Text>
            </View>
            <Text style={styles.tipsText}>
              Tap the "Add Card" button to create your first business card or scan an existing one.
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
          cardName={selectedCard?.full_name || ''}
          onExportVCard={handleExportVCard}
        />
      )}

      {/* Add Card Modal */}
      <AddCardModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreateDigital={handleCreateDigital}
        onScanCard={handleScanCard}
      />

      {/* Card Scanner */}
      <CardScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onSave={handleSaveScannedCard}
      />
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
    fontWeight: '500',
    color: colors.gray[400],
    letterSpacing: -0.2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.gray[400],
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.purple[600],
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 14,
    marginTop: 28,
    shadowColor: colors.purple[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  signInButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: -0.2,
  },
  header: {
    marginTop: 8,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.gray[400],
    marginTop: 6,
    letterSpacing: -0.2,
  },
  cardInfoSection: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  cardInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardInfoName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.4,
    flex: 1,
  },
  primaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  primaryTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.yellow[400],
  },
  cardInfoType: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.gray[500],
    marginTop: 4,
    letterSpacing: -0.2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  shareButton: {
    backgroundColor: colors.purple[600],
    shadowColor: colors.purple[600],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: -0.2,
  },
  moreActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  moreActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  moreActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[400],
    letterSpacing: -0.2,
  },
  deleteText: {
    color: colors.red[400],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.red[400],
    flex: 1,
    letterSpacing: -0.2,
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelEditButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelEditText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[400],
    letterSpacing: -0.2,
  },
  saveButton: {
    flex: 2,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  tipsCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  tipsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.cyan[400],
    letterSpacing: -0.3,
  },
  tipsText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.gray[300],
    lineHeight: 22,
    paddingHorizontal: 18,
    paddingBottom: 16,
    letterSpacing: -0.2,
  },
});
