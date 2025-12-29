import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../styles/colors';
import * as api from '../services/api';

interface Industry {
  id: string;
  name: string;
  icon: string;
}

interface IndustryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (industryId: string) => void;
  currentIndustry?: string | null;
}

export default function IndustryModal({
  visible,
  onClose,
  onSelect,
  currentIndustry,
}: IndustryModalProps) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(currentIndustry || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchIndustries();
      setSelectedId(currentIndustry || null);
    }
  }, [visible, currentIndustry]);

  const fetchIndustries = async () => {
    try {
      setIsLoading(true);
      const response = await api.getIndustries();
      setIndustries(response.industries || []);
    } catch (err) {
      console.error('Error fetching industries:', err);
      // Fallback industries
      setIndustries([
        { id: 'real_estate', name: 'Real Estate', icon: 'home' },
        { id: 'technology', name: 'Technology', icon: 'cpu' },
        { id: 'finance', name: 'Finance', icon: 'dollar-sign' },
        { id: 'healthcare', name: 'Healthcare', icon: 'heart' },
        { id: 'marketing', name: 'Marketing', icon: 'trending-up' },
        { id: 'legal', name: 'Legal', icon: 'briefcase' },
        { id: 'consulting', name: 'Consulting', icon: 'users' },
        { id: 'sales', name: 'Sales', icon: 'shopping-cart' },
        { id: 'general', name: 'General / Other', icon: 'grid' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;

    try {
      setIsSaving(true);
      await api.updatePreferences({ industry: selectedId });
      onSelect(selectedId);
      onClose();
    } catch (err) {
      console.error('Error saving industry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.title}>Select Your Industry</Text>
            <Text style={styles.subtitle}>
              We'll suggest relevant tags to help you organize contacts
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.purple[500]} />
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {industries.map((industry) => {
                const isSelected = selectedId === industry.id;
                return (
                  <TouchableOpacity
                    key={industry.id}
                    style={[
                      styles.industryItem,
                      isSelected && styles.industryItemSelected,
                    ]}
                    onPress={() => setSelectedId(industry.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.industryIcon,
                      isSelected && styles.industryIconSelected,
                    ]}>
                      <Icon
                        name={industry.icon}
                        size={22}
                        color={isSelected ? colors.white : colors.gray[400]}
                      />
                    </View>
                    <Text style={[
                      styles.industryName,
                      isSelected && styles.industryNameSelected,
                    ]}>
                      {industry.name}
                    </Text>
                    {isSelected && (
                      <Icon name="check" size={20} color={colors.purple[400]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !selectedId && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!selectedId || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {selectedId ? 'Save & Get Tags' : 'Select an Industry'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={onClose}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[600],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 16,
    maxHeight: 350,
  },
  industryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: colors.gray[800],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  industryItemSelected: {
    borderColor: colors.purple[500],
    backgroundColor: colors.purple[900] + '40',
  },
  industryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gray[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  industryIconSelected: {
    backgroundColor: colors.purple[600],
  },
  industryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[300],
  },
  industryNameSelected: {
    color: colors.text,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[800],
  },
  saveButton: {
    backgroundColor: colors.purple[600],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray[700],
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
