import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../styles/colors';

interface AddCardModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateDigital: () => void;
  onScanCard: () => void;
}

export function AddCardModal({
  visible,
  onClose,
  onCreateDigital,
  onScanCard,
}: AddCardModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Business Card</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={22} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Choose how you want to add a new card
          </Text>

          <View style={styles.options}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                onClose();
                onCreateDigital();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, styles.digitalIcon]}>
                <Icon name="edit-3" size={28} color={colors.purple[400]} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Create Digital Card</Text>
                <Text style={styles.optionDescription}>
                  Design a new card with templates
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.gray[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                onClose();
                onScanCard();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, styles.scanIcon]}>
                <Icon name="camera" size={28} color={colors.cyan[400]} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Scan Physical Card</Text>
                <Text style={styles.optionDescription}>
                  Take a photo of an existing card
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.gray[400],
    marginBottom: 24,
    letterSpacing: -0.2,
  },
  options: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  digitalIcon: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  scanIcon: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  optionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.gray[400],
    letterSpacing: -0.2,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[400],
    letterSpacing: -0.2,
  },
});
