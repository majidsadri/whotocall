import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
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

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
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
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header with avatar */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {contact.enrichment?.avatar ? (
            <Image
              source={{ uri: contact.enrichment.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {contact.name}
          </Text>
          {(contact.role || contact.company) && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {contact.role}
              {contact.role && contact.company ? ' @ ' : ''}
              {contact.company}
            </Text>
          )}
        </View>

        {score !== undefined && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{Math.round(score)}</Text>
          </View>
        )}
      </View>

      {/* Contact details */}
      <View style={styles.details}>
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
        {contact.met_date && (
          <View style={styles.detailRow}>
            <Icon name="calendar" size={14} color={colors.gray[400]} />
            <Text style={styles.detailText}>
              Met {formatRelativeTime(contact.met_date)}
            </Text>
          </View>
        )}
      </View>

      {/* Priority bar */}
      {contact.priority !== undefined && (
        <View style={styles.priorityContainer}>
          <View style={styles.priorityTrack}>
            <View
              style={[styles.priorityFill, { width: `${contact.priority}%` }]}
            />
          </View>
        </View>
      )}

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {contact.tags.slice(0, expanded ? undefined : 4).map((tag, index) => (
            <TagBadge key={index} label={tag} variant={getTagVariant(index)} />
          ))}
          {!expanded && contact.tags.length > 4 && (
            <View style={styles.moreTag}>
              <Text style={styles.moreTagText}>+{contact.tags.length - 4}</Text>
            </View>
          )}
        </View>
      )}

      {/* Match reason */}
      {matchReason && (
        <View style={styles.matchReasonContainer}>
          <Text style={styles.matchReasonText}>Matched: {matchReason}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {contact.linkedin_url && (
          <TouchableOpacity style={styles.actionButton} onPress={openLinkedIn}>
            <Icon name="linkedin" size={16} color={colors.blue[500]} />
          </TouchableOpacity>
        )}
        {contact.email && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL(`mailto:${contact.email}`)}
          >
            <Icon name="mail" size={16} color={colors.gray[500]} />
          </TouchableOpacity>
        )}
        {contact.phone && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL(`tel:${contact.phone}`)}
          >
            <Icon name="phone" size={16} color={colors.gray[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded content */}
      {expanded && contact.raw_context && (
        <View style={styles.expandedContent}>
          <Text style={styles.contextLabel}>Notes</Text>
          <Text style={styles.contextText}>"{contact.raw_context}"</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
  },
  scoreBadge: {
    backgroundColor: colors.green[100],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.green[200],
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.green[700],
  },
  details: {
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: 10,
  },
  priorityContainer: {
    marginBottom: 14,
  },
  priorityTrack: {
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  priorityFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  moreTag: {
    height: 28,
    paddingHorizontal: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
  },
  matchReasonContainer: {
    backgroundColor: colors.green[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.green[200],
  },
  matchReasonText: {
    fontSize: 13,
    color: colors.green[700],
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  expandedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  contextText: {
    fontSize: 15,
    color: colors.gray[600],
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
