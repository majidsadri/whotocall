import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { BusinessCardInput } from '../../types/businessCard';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/common';

interface CardEditFormProps {
  data: BusinessCardInput;
  onUpdateField: <K extends keyof BusinessCardInput>(key: K, value: BusinessCardInput[K]) => void;
  onPickImage?: () => void;
}

export function CardEditForm({ data, onUpdateField, onPickImage }: CardEditFormProps) {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={onPickImage}
          activeOpacity={0.8}
        >
          {data.avatar_url ? (
            <Image source={{ uri: data.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {data.full_name ? getInitials(data.full_name) : 'ME'}
              </Text>
            </View>
          )}
          <View style={styles.cameraButton}>
            <Icon name="camera" size={14} color={colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change photo</Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputWrapper}>
            <Icon name="user" size={18} color={colors.gray[500]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={data.full_name}
              onChangeText={(value) => onUpdateField('full_name', value)}
              placeholder="John Doe"
              placeholderTextColor={colors.gray[500]}
            />
          </View>
        </View>

        {/* Title / Role */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Title</Text>
          <View style={styles.inputWrapper}>
            <Icon name="briefcase" size={18} color={colors.gray[500]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={data.title || ''}
              onChangeText={(value) => onUpdateField('title', value)}
              placeholder="Software Engineer"
              placeholderTextColor={colors.gray[500]}
            />
          </View>
        </View>

        {/* Company */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company</Text>
          <View style={styles.inputWrapper}>
            <Icon name="home" size={18} color={colors.gray[500]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={data.company || ''}
              onChangeText={(value) => onUpdateField('company', value)}
              placeholder="Acme Inc."
              placeholderTextColor={colors.gray[500]}
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Icon name="mail" size={18} color={colors.gray[500]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={data.email || ''}
              onChangeText={(value) => onUpdateField('email', value)}
              placeholder="john@example.com"
              placeholderTextColor={colors.gray[500]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <View style={styles.inputWrapper}>
            <Icon name="phone" size={18} color={colors.gray[500]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={data.phone || ''}
              onChangeText={(value) => onUpdateField('phone', value)}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={colors.gray[500]}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Website */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Website</Text>
          <View style={styles.inputWrapper}>
            <Icon name="globe" size={18} color={colors.gray[500]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={data.website || ''}
              onChangeText={(value) => onUpdateField('website', value)}
              placeholder="https://example.com"
              placeholderTextColor={colors.gray[500]}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* LinkedIn */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>LinkedIn URL</Text>
          <View style={styles.inputWrapper}>
            <Icon name="linkedin" size={18} color={colors.gray[500]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={data.linkedin_url || ''}
              onChangeText={(value) => onUpdateField('linkedin_url', value)}
              placeholder="https://linkedin.com/in/johndoe"
              placeholderTextColor={colors.gray[500]}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray[700],
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.purple[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cyan[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 13,
    color: colors.gray[500],
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },
});
