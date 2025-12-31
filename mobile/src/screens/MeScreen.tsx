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
          <ActivityIndicator size="large" color={colors.gray[500]} />
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
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gray[500]}
            colors={[colors.gray[500]]}
          />
        }
      >

        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>My Cards</Text>
          <Text style={styles.pageSubtitle}>
            {cards.length === 0
              ? 'Create your first business card'
              : `${cards.length} card${cards.length > 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Card Carousel */}
        <CardCarousel
          cards={cards}
          selectedIndex={selectedCardIndex}
          onSelectIndex={selectCardByIndex}
          onAddCard={handleAddCard}
        />

        {/* Card Actions Panel */}
        {selectedCard && !isEditMode && (
          <View style={styles.actionsPanel}>
            {/* Card Info Row */}
            <View style={styles.cardInfoRow}>
              <View style={styles.cardInfoLeft}>
                <Text style={styles.cardInfoName} numberOfLines={1}>
                  {selectedCard.card_label || selectedCard.full_name || 'Untitled Card'}
                </Text>
                <View style={styles.cardInfoMeta}>
                  <View style={styles.cardTypeBadge}>
                    <Icon
                      name={isScannedCard ? 'camera' : 'credit-card'}
                      size={12}
                      color={colors.gray[500]}
                    />
                    <Text style={styles.cardTypeText}>
                      {isScannedCard ? 'Scanned' : 'Digital'}
                    </Text>
                  </View>
                  {selectedCard.is_primary && (
                    <View style={styles.primaryBadge}>
                      <Icon name="star" size={12} color={colors.yellow[500]} />
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Main Actions */}
            <View style={styles.mainActions}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShare}
              >
                <Icon name="share-2" size={20} color={colors.white} />
                <Text style={styles.shareBtnText}>Share Card</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              {!isScannedCard && (
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={handleStartEdit}
                >
                  <View style={styles.quickActionIcon}>
                    <Icon name="edit-2" size={18} color={colors.green[600]} />
                  </View>
                  <Text style={styles.quickActionText}>Edit</Text>
                </TouchableOpacity>
              )}

              {!selectedCard.is_primary && (
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={handleSetPrimary}
                >
                  <View style={styles.quickActionIcon}>
                    <Icon name="star" size={18} color={colors.yellow[500]} />
                  </View>
                  <Text style={styles.quickActionText}>Set Primary</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleDeleteCard}
              >
                <View style={[styles.quickActionIcon, styles.deleteIcon]}>
                  <Icon name="trash-2" size={18} color={colors.gray[400]} />
                </View>
                <Text style={[styles.quickActionText, styles.deleteActionText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Edit Mode for Digital Cards */}
        {isEditMode && !isScannedCard && editFormData && (
          <View style={styles.editSection}>
            {/* Edit Header */}
            <View style={styles.editHeader}>
              <View style={styles.editHeaderIcon}>
                <Icon name="edit-3" size={24} color={colors.green[600]} />
              </View>
              <View style={styles.editHeaderText}>
                <Text style={styles.editHeaderTitle}>Edit Your Card</Text>
                <Text style={styles.editHeaderSubtitle}>Customize your digital business card</Text>
              </View>
            </View>

            {/* Template Selector */}
            <View style={styles.editCard}>
              <Text style={styles.editSectionLabel}>Choose Design</Text>
              <TemplateSelector
                selectedTemplate={editFormData.template_id || 'gradient'}
                onSelectTemplate={handleTemplateChange}
              />
            </View>

            {/* Edit Form */}
            <View style={styles.editCard}>
              <Text style={styles.editSectionLabel}>Your Information</Text>
              <CardEditForm
                data={editFormData}
                onUpdateField={updateEditField}
                onPickImage={handlePickImage}
              />
            </View>

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
                  styles.saveEditButton,
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
                    <Text style={styles.saveEditButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tips Card for new users */}
        {cards.length === 0 && (
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIconContainer}>
              <Icon name="credit-card" size={32} color={colors.green[600]} />
            </View>
            <Text style={styles.welcomeTitle}>Create Your First Card</Text>
            <Text style={styles.welcomeText}>
              Design a professional digital business card that you can share instantly with anyone.
            </Text>
            <View style={styles.welcomeFeatures}>
              <View style={styles.welcomeFeature}>
                <Icon name="check-circle" size={16} color={colors.green[500]} />
                <Text style={styles.welcomeFeatureText}>Multiple card designs</Text>
              </View>
              <View style={styles.welcomeFeature}>
                <Icon name="check-circle" size={16} color={colors.green[500]} />
                <Text style={styles.welcomeFeatureText}>QR code sharing</Text>
              </View>
              <View style={styles.welcomeFeature}>
                <Icon name="check-circle" size={16} color={colors.green[500]} />
                <Text style={styles.welcomeFeatureText}>Scan paper cards</Text>
              </View>
            </View>
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
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.gray[50],
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
    backgroundColor: colors.gray[50],
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
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
    backgroundColor: colors.green[600],
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 14,
    marginTop: 28,
    shadowColor: colors.green[600],
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
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray[900],
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[400],
    marginTop: 6,
  },
  // Actions Panel
  actionsPanel: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInfoRow: {
    marginBottom: 20,
  },
  cardInfoLeft: {
    flex: 1,
  },
  cardInfoName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  cardInfoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cardTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[500],
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.yellow[50],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.yellow[600],
  },
  mainActions: {
    marginBottom: 20,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.green[600],
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: colors.green[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  shareBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  quickActionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  deleteIcon: {
    backgroundColor: colors.gray[50],
  },
  deleteActionText: {
    color: colors.gray[400],
  },
  // Edit Section Styles
  editSection: {
    marginTop: 16,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  editHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.green[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  editHeaderText: {
    flex: 1,
  },
  editHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    letterSpacing: -0.4,
  },
  editHeaderSubtitle: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 4,
  },
  editCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  editSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  saveEditButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.green[600],
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveEditButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: colors.green[100],
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
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  cancelEditText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[600],
  },
  saveButton: {
    flex: 2,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  welcomeCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  welcomeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.green[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  welcomeFeatures: {
    gap: 12,
    alignSelf: 'stretch',
  },
  welcomeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.gray[50],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  welcomeFeatureText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[700],
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
