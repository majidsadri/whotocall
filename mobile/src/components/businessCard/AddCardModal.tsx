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
              <Icon name="x" size={22} color={colors.smoke} />
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
                <Icon name="edit-3" size={28} color={colors.accent} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Create Digital Card</Text>
                <Text style={styles.optionDescription}>
                  Design a new card with templates
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.smoke} />
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
                <Icon name="camera" size={28} color={colors.ink} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Scan Physical Card</Text>
                <Text style={styles.optionDescription}>
                  Take a photo of an existing card
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.smoke} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.misty,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.smoke,
    marginBottom: 24,
    letterSpacing: -0.2,
  },
  options: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  digitalIcon: {
    backgroundColor: colors.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  scanIcon: {
    backgroundColor: colors.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  optionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.smoke,
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
    color: colors.smoke,
    letterSpacing: -0.2,
  },
});
