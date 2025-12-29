import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Contact } from '../types';
import TagBadge, { getTagVariant } from './TagBadge';
import { colors } from '../styles/colors';

interface ContactCardProps {
  contact: Contact;
  score?: number;
  matchReason?: string;
  onPress?: () => void;
  expanded?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ContactCard({
  contact,
  score,
  matchReason,
  onPress,
  expanded = false,
}: ContactCardProps) {
  const openLinkedIn = () => {
    if (contact.linkedin_url) {
      Linking.openURL(contact.linkedin_url);
    } else {
      // Google search for LinkedIn profile
      const searchQuery = encodeURIComponent(
        `${contact.name} ${contact.company || ''} LinkedIn`
      );
      Linking.openURL(`https://www.google.com/search?q=${searchQuery}`);
    }
  };

  const callPhone = async () => {
    if (!contact.phone) return;

    const phoneUrl = Platform.OS === 'ios'
      ? `telprompt:${contact.phone}`
      : `tel:${contact.phone}`;

    const canOpen = await Linking.canOpenURL(phoneUrl);
    if (canOpen) {
      Linking.openURL(phoneUrl);
    } else {
      Alert.alert(
        'Cannot Make Call',
        `Phone: ${contact.phone}`,
        [{ text: 'OK' }]
      );
    }
  };

  const sendEmail = async () => {
    if (!contact.email) return;

    const emailUrl = `mailto:${contact.email}`;
    const canOpen = await Linking.canOpenURL(emailUrl);
    if (canOpen) {
      Linking.openURL(emailUrl);
    } else {
      Alert.alert(
        'Cannot Send Email',
        `Email: ${contact.email}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Compact card (not expanded)
  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        {contact.enrichment?.avatar ? (
          <Image
            source={{ uri: contact.enrichment.avatar }}
            style={styles.compactAvatar}
          />
        ) : (
          <View style={styles.compactAvatarPlaceholder}>
            <Text style={styles.compactAvatarText}>{getInitials(contact.name)}</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>
            {contact.name}
          </Text>
          <Text style={styles.compactSubtitle} numberOfLines={1}>
            {contact.role || contact.company || contact.industry || 'No details'}
          </Text>
        </View>

        {/* Phone Button */}
        {contact.phone && (
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={callPhone}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="phone" size={16} color={colors.cyan[400]} />
          </TouchableOpacity>
        )}

        {/* LinkedIn Button */}
        <TouchableOpacity
          style={[
            styles.linkedinButton,
            contact.linkedin_url ? styles.linkedinButtonActive : styles.linkedinButtonSearch,
          ]}
          onPress={openLinkedIn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            name="linkedin"
            size={16}
            color={contact.linkedin_url ? '#0A66C2' : colors.gray[400]}
          />
        </TouchableOpacity>

        {/* Expand indicator */}
        <Icon name="chevron-right" size={18} color={colors.gray[400]} />
      </TouchableOpacity>
    );
  }

  // Expanded card
  return (
    <TouchableOpacity
      style={styles.expandedContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.expandedHeader}>
        {contact.enrichment?.avatar ? (
          <Image
            source={{ uri: contact.enrichment.avatar }}
            style={styles.expandedAvatar}
          />
        ) : (
          <View style={styles.expandedAvatarPlaceholder}>
            <Text style={styles.expandedAvatarText}>{getInitials(contact.name)}</Text>
          </View>
        )}

        <View style={styles.expandedHeaderInfo}>
          <Text style={styles.expandedName}>{contact.name}</Text>
          {(contact.role || contact.company) && (
            <Text style={styles.expandedSubtitle}>
              {contact.role}
              {contact.role && contact.company ? ' @ ' : ''}
              {contact.company}
            </Text>
          )}
        </View>

        {/* LinkedIn Button */}
        <TouchableOpacity
          style={[
            styles.linkedinButtonLarge,
            contact.linkedin_url ? styles.linkedinButtonActive : styles.linkedinButtonSearch,
          ]}
          onPress={openLinkedIn}
        >
          <Icon
            name="linkedin"
            size={20}
            color={contact.linkedin_url ? '#0A66C2' : colors.gray[400]}
          />
        </TouchableOpacity>
      </View>

      {/* Details */}
      <View style={styles.expandedDetails}>
        {contact.location && (
          <View style={styles.detailRow}>
            <Icon name="map-pin" size={14} color={colors.gray[400]} />
            <Text style={styles.detailText}>{contact.location}</Text>
          </View>
        )}
        {contact.industry && (
          <View style={styles.detailRow}>
            <Icon name="briefcase" size={14} color={colors.gray[400]} />
            <Text style={styles.detailText}>{contact.industry}</Text>
          </View>
        )}
        {contact.meeting_location && (
          <View style={styles.detailRow}>
            <Icon name="navigation" size={14} color={colors.gray[400]} />
            <Text style={styles.detailText}>Met at: {contact.meeting_location}</Text>
          </View>
        )}
      </View>

      {/* All Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>Tags</Text>
          <View style={styles.tagsContainer}>
            {contact.tags.map((tag, index) => (
              <TagBadge key={index} label={tag} variant={getTagVariant(index)} />
            ))}
          </View>
        </View>
      )}

      {/* Match reason */}
      {matchReason && (
        <View style={styles.matchReasonContainer}>
          <Icon name="zap" size={12} color={colors.cyan[400]} />
          <Text style={styles.matchReasonText}>{matchReason}</Text>
        </View>
      )}

      {/* Notes */}
      {contact.raw_context && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>"{contact.raw_context}"</Text>
        </View>
      )}

      {/* Action buttons */}
      {(contact.email || contact.phone) && (
        <View style={styles.actions}>
          {contact.phone && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={callPhone}
            >
              <Icon name="phone" size={16} color={colors.cyan[400]} />
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={sendEmail}
            >
              <Icon name="mail" size={16} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Collapse hint */}
      <View style={styles.collapseHint}>
        <Icon name="chevron-up" size={16} color={colors.gray[400]} />
        <Text style={styles.collapseText}>Tap to collapse</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact card styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  compactAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.purple[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAvatarText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 13,
    color: colors.gray[400],
  },
  compactActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    marginRight: 6,
  },
  linkedinButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  linkedinButtonLarge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedinButtonActive: {
    backgroundColor: 'rgba(10, 102, 194, 0.15)',
  },
  linkedinButtonSearch: {
    backgroundColor: colors.gray[800],
    borderWidth: 1,
    borderColor: colors.gray[700],
  },

  // Expanded card styles
  expandedContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.purple[700],
    shadowColor: colors.purple[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  expandedAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.purple[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  expandedAvatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  expandedHeaderInfo: {
    flex: 1,
    marginLeft: 14,
  },
  expandedName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  expandedSubtitle: {
    fontSize: 14,
    color: colors.gray[400],
  },
  expandedDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.gray[400],
    marginLeft: 10,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchReasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  matchReasonText: {
    fontSize: 13,
    color: colors.cyan[400],
    fontWeight: '500',
    flex: 1,
  },
  notesSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 14,
    color: colors.gray[400],
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.gray[800],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  collapseHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  collapseText: {
    fontSize: 12,
    color: colors.gray[500],
  },
});
