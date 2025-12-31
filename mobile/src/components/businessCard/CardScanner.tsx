import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DocumentScanner from 'react-native-document-scanner-plugin';
import { useImagePicker } from '../../hooks/useImagePicker';
import { colors } from '../../styles/colors';

interface CardScannerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (imageUrl: string, label: string) => Promise<void>;
}

type ScannerStep = 'capture' | 'label' | 'saving';

export function CardScanner({
  visible,
  onClose,
  onSave,
}: CardScannerProps) {
  const [step, setStep] = useState<ScannerStep>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const { pickFromGallery } = useImagePicker();

  // Use document scanner for camera - it provides edge detection and perspective correction
  const handleScanWithCamera = useCallback(async () => {
    try {
      setIsScanning(true);
      const { scannedImages } = await DocumentScanner.scanDocument({
        croppedImageQuality: 100,
        maxNumDocuments: 1,
      });

      if (scannedImages && scannedImages.length > 0) {
        setImageUri(scannedImages[0]);
        setStep('label');
      }
    } catch (error) {
      console.error('Document scanner error:', error);
      Alert.alert('Error', 'Failed to scan document. Please try again.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Use gallery picker for existing images
  const handlePickFromGallery = useCallback(async () => {
    const uri = await pickFromGallery();
    if (uri) {
      setImageUri(uri);
      setStep('label');
    }
  }, [pickFromGallery]);

  const handleSave = useCallback(async () => {
    if (!imageUri) return;

    const cardLabel = label.trim() || 'Business Card';

    setStep('saving');
    setIsSaving(true);

    try {
      await onSave(imageUri, cardLabel);
      handleClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to save card. Please try again.');
      setStep('label');
    } finally {
      setIsSaving(false);
    }
  }, [imageUri, label, onSave]);

  const handleClose = useCallback(() => {
    setStep('capture');
    setImageUri(null);
    setLabel('');
    onClose();
  }, [onClose]);

  const handleRetake = useCallback(() => {
    setImageUri(null);
    setLabel('');
    setStep('capture');
  }, []);

  const renderCaptureStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.captureIconContainer}>
        <Icon name="camera" size={48} color={colors.accent} />
      </View>
      <Text style={styles.stepTitle}>Scan Business Card</Text>
      <Text style={styles.stepDescription}>
        Scan with camera for auto-straightening, or pick from gallery
      </Text>

      {/* Tip for scanning */}
      <View style={styles.tipContainer}>
        <Icon name="zap" size={14} color={colors.accent} />
        <Text style={styles.tipText}>
          Camera mode auto-detects card edges and straightens the image
        </Text>
      </View>

      <View style={styles.captureButtons}>
        <TouchableOpacity
          style={[styles.captureButton, styles.cameraButton]}
          onPress={handleScanWithCamera}
          disabled={isScanning}
          activeOpacity={0.7}
        >
          {isScanning ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Icon name="camera" size={24} color={colors.white} />
              <Text style={styles.captureButtonText}>Scan Card</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, styles.galleryButton]}
          onPress={handlePickFromGallery}
          disabled={isScanning}
          activeOpacity={0.7}
        >
          <Icon name="image" size={24} color={colors.ink} />
          <Text style={styles.galleryButtonText}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  const renderLabelStep = () => (
    <View style={styles.stepContainer}>
      {imageUri && (
        <View style={styles.previewContainer}>
          <View style={styles.previewImageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          </View>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetake}
            activeOpacity={0.7}
          >
            <Icon name="refresh-cw" size={16} color={colors.ink} />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.labelTitle}>Add a Label</Text>
      <Text style={styles.labelDescription}>
        Give this card a name to help you remember it
      </Text>

      <TextInput
        style={styles.labelInput}
        placeholder="e.g., John's Card, Acme Corp"
        placeholderTextColor={colors.smoke}
        value={label}
        onChangeText={setLabel}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      <TouchableOpacity
        style={[styles.saveButton, !imageUri && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!imageUri || isSaving}
        activeOpacity={0.7}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <>
            <Icon name="check" size={20} color={colors.white} />
            <Text style={styles.saveButtonText}>Save Card</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSavingStep = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.stepTitle}>Saving Card</Text>
      <Text style={styles.stepDescription}>
        Adding your business card...
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="x" size={24} color={colors.smoke} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Card</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {step === 'capture' && renderCaptureStep()}
          {step === 'label' && renderLabelStep()}
          {step === 'saving' && renderSavingStep()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.misty,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  captureIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  stepDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.smoke,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
    letterSpacing: -0.2,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.muted,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.smoke,
    flex: 1,
    letterSpacing: -0.2,
  },
  captureButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 9999,
  },
  cameraButton: {
    backgroundColor: colors.ink,
  },
  galleryButton: {
    backgroundColor: colors.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: -0.2,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  previewContainer: {
    width: '100%',
    marginBottom: 24,
    position: 'relative',
  },
  previewImageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.muted,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.canvas,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
  },
  labelTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  labelDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.smoke,
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  labelInput: {
    width: '100%',
    backgroundColor: colors.muted,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: '500',
    color: colors.ink,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
    marginBottom: 24,
    letterSpacing: -0.2,
  },
  saveButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.ink,
    paddingVertical: 16,
    borderRadius: 9999,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: -0.2,
  },
});
