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
import TagBadge from './TagBadge';
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

  // Compact card (not expanded) - ListRow style
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
            <Icon name="phone" size={16} color={colors.accent} />
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
            color={contact.linkedin_url ? '#0A66C2' : colors.smoke}
          />
        </TouchableOpacity>

        {/* Expand indicator */}
        <Icon name="chevron-right" size={18} color={colors.smoke} />
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
            color={contact.linkedin_url ? '#0A66C2' : colors.smoke}
          />
        </TouchableOpacity>
      </View>

      {/* Details */}
      <View style={styles.expandedDetails}>
        {contact.location && (
          <View style={styles.detailRow}>
            <Icon name="map-pin" size={14} color={colors.smoke} />
            <Text style={styles.detailText}>{contact.location}</Text>
          </View>
        )}
        {contact.industry && (
          <View style={styles.detailRow}>
            <Icon name="briefcase" size={14} color={colors.smoke} />
            <Text style={styles.detailText}>{contact.industry}</Text>
          </View>
        )}
        {contact.meeting_location && (
          <View style={styles.detailRow}>
            <Icon name="navigation" size={14} color={colors.smoke} />
            <Text style={styles.detailText}>Met at: {contact.meeting_location}</Text>
          </View>
        )}
      </View>

      {/* All Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>TAGS</Text>
          <View style={styles.tagsContainer}>
            {contact.tags.map((tag, index) => (
              <TagBadge key={index} label={tag} />
            ))}
          </View>
        </View>
      )}

      {/* Match reason */}
      {matchReason && (
        <View style={styles.matchReasonContainer}>
          <Icon name="zap" size={12} color={colors.accent} />
          <Text style={styles.matchReasonText}>{matchReason}</Text>
        </View>
      )}

      {/* Notes */}
      {contact.raw_context && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>NOTES</Text>
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
              <Icon name="phone" size={16} color={colors.accent} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={sendEmail}
            >
              <Icon name="mail" size={16} color={colors.smoke} />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Collapse hint */}
      <View style={styles.collapseHint}>
        <Icon name="chevron-up" size={16} color={colors.smoke} />
        <Text style={styles.collapseText}>Tap to collapse</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact card styles - ListRow style
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.misty,
  },
  compactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  compactAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  compactName: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.ink,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  compactSubtitle: {
    fontSize: 14,
    color: colors.smoke,
  },
  compactActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
    marginRight: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  linkedinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  linkedinButtonLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedinButtonActive: {
    backgroundColor: 'rgba(10, 102, 194, 0.1)',
  },
  linkedinButtonSearch: {
    backgroundColor: colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },

  // Expanded card styles
  expandedContainer: {
    backgroundColor: colors.canvas,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  expandedAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  expandedHeaderInfo: {
    flex: 1,
    marginLeft: 14,
  },
  expandedName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  expandedSubtitle: {
    fontSize: 15,
    color: colors.smoke,
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
    color: colors.smoke,
    marginLeft: 10,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.smoke,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
    backgroundColor: colors.muted,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  matchReasonText: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '500',
    flex: 1,
  },
  notesSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.misty,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.smoke,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 15,
    color: colors.smoke,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
  },
  collapseHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.misty,
  },
  collapseText: {
    fontSize: 12,
    color: colors.smoke,
  },
});
