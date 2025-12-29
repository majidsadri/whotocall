import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  Alert,
  Platform,
  Share as RNShare,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { QRCodeDisplay } from './QRCodeDisplay';
import { colors } from '../../styles/colors';

// Try to import Clipboard
let Clipboard: any = null;
try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  // Library not available, will use fallback
}

// Try to import Share
let Share: any = null;
try {
  Share = require('react-native-share').default;
} catch (e) {
  // Library not installed
}

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  shareUrl: string;
  cardName: string;
  onExportVCard?: () => Promise<void>;
}

export function ShareModal({
  visible,
  onClose,
  shareUrl,
  cardName,
  onExportVCard,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      if (Clipboard && Clipboard.setString) {
        Clipboard.setString(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback: show the URL in an alert for manual copy
        Alert.alert(
          'Share Link',
          shareUrl,
          [{ text: 'OK' }],
          { cancelable: true }
        );
      }
    } catch (error) {
      Alert.alert('Share Link', shareUrl);
    }
  };

  const handleShareEmail = async () => {
    const subject = encodeURIComponent(`${cardName}'s Business Card`);
    const body = encodeURIComponent(`Check out my digital business card: ${shareUrl}`);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Error', 'Could not open email app');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share via email');
    }
  };

  const handleShareSMS = async () => {
    const message = encodeURIComponent(`Check out my digital business card: ${shareUrl}`);
    const smsUrl = Platform.OS === 'ios' ? `sms:&body=${message}` : `sms:?body=${message}`;

    try {
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Error', 'Could not open SMS app');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share via SMS');
    }
  };

  const handleNativeShare = async () => {
    try {
      // Use React Native's built-in Share API
      await RNShare.share({
        title: `${cardName}'s Business Card`,
        message: `Check out my digital business card: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Share', `Share this link: ${shareUrl}`);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.sheet}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>Share Your Card</Text>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCodeDisplay value={shareUrl} size={180} />
            <Text style={styles.qrHint}>Scan to view your card</Text>
          </View>

          {/* Share Options */}
          <View style={styles.options}>
            <TouchableOpacity style={styles.option} onPress={handleCopyLink}>
              <View style={[styles.optionIcon, { backgroundColor: '#C4B5FD' }]}>
                <Icon name={copied ? 'check' : 'copy'} size={20} color={copied ? '#22C55E' : colors.white} />
              </View>
              <Text style={styles.optionLabel}>{copied ? 'Copied!' : 'Copy Link'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={handleShareEmail}>
              <View style={[styles.optionIcon, { backgroundColor: '#A78BFA' }]}>
                <Icon name="mail" size={20} color={colors.white} />
              </View>
              <Text style={styles.optionLabel}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={handleShareSMS}>
              <View style={[styles.optionIcon, { backgroundColor: '#8B5CF6' }]}>
                <Icon name="message-circle" size={20} color={colors.white} />
              </View>
              <Text style={styles.optionLabel}>SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={handleNativeShare}>
              <View style={[styles.optionIcon, { backgroundColor: '#7C3AED' }]}>
                <Icon name="share-2" size={20} color={colors.white} />
              </View>
              <Text style={styles.optionLabel}>More</Text>
            </TouchableOpacity>
          </View>

          {/* vCard Export */}
          {onExportVCard && (
            <TouchableOpacity style={styles.vcardButton} onPress={onExportVCard}>
              <Icon name="download" size={18} color="#A78BFA" />
              <Text style={styles.vcardText}>Export as vCard (.vcf)</Text>
            </TouchableOpacity>
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[600],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  qrHint: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray[400],
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  option: {
    alignItems: 'center',
    gap: 8,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 13,
    color: colors.gray[300],
    fontWeight: '500',
  },
  vcardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 16,
  },
  vcardText: {
    fontSize: 15,
    color: '#A78BFA',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: colors.gray[800],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
