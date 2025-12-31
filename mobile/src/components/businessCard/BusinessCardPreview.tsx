import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { BusinessCardInput, TemplateId } from '../../types/businessCard';
import { colors } from '../../styles/colors';

interface BusinessCardPreviewProps {
  data: BusinessCardInput;
  size?: 'small' | 'large';
}

export function BusinessCardPreview({ data, size = 'large' }: BusinessCardPreviewProps) {
  const isSmall = size === 'small';

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderAvatar = (avatarSize: number, textSize: number) => {
    if (data.avatar_url) {
      return (
        <Image
          source={{ uri: data.avatar_url }}
          style={[
            styles.avatar,
            { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
          ]}
        />
      );
    }

    return (
      <View
        style={[
          styles.avatarPlaceholder,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      >
        <Text style={[styles.avatarInitials, { fontSize: textSize }]}>
          {getInitials(data.full_name || 'Me')}
        </Text>
      </View>
    );
  };

  // Classic Template - Warm cream with elegant centered layout
  const renderClassicTemplate = () => (
    <View style={[styles.card, styles.cardClassic, isSmall && styles.cardSmall]}>
      {renderAvatar(isSmall ? 48 : 80, isSmall ? 18 : 28)}
      <Text style={[styles.name, styles.nameClassic, isSmall && styles.nameSmall]} numberOfLines={1}>
        {data.full_name || 'Your Name'}
      </Text>
      {data.title && (
        <Text style={[styles.title, styles.titleClassic, isSmall && styles.titleSmall]} numberOfLines={1}>
          {data.title}
        </Text>
      )}
      {data.company && (
        <Text style={[styles.company, isSmall && styles.companySmall]} numberOfLines={1}>
          {data.company}
        </Text>
      )}
      {!isSmall && (
        <View style={styles.contactRow}>
          {data.email && (
            <View style={styles.contactItem}>
              <Icon name="mail" size={14} color="#8B7355" />
              <Text style={styles.contactTextClassic} numberOfLines={1}>{data.email}</Text>
            </View>
          )}
          {data.phone && (
            <View style={styles.contactItem}>
              <Icon name="phone" size={14} color="#8B7355" />
              <Text style={styles.contactTextClassic}>{data.phone}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  // Modern Template - Dark premium with accent bar
  const renderModernTemplate = () => (
    <View style={[styles.card, styles.cardModern, isSmall && styles.cardSmall]}>
      <View style={[styles.modernAccent, { backgroundColor: data.accent_color || colors.green[500] }]} />
      <View style={styles.modernContent}>
        <View style={styles.modernLeft}>
          {data.avatar_url ? (
            <Image
              source={{ uri: data.avatar_url }}
              style={[
                styles.avatarModern,
                { width: isSmall ? 40 : 64, height: isSmall ? 40 : 64, borderRadius: (isSmall ? 40 : 64) / 2 },
              ]}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholderModern,
                { width: isSmall ? 40 : 64, height: isSmall ? 40 : 64, borderRadius: (isSmall ? 40 : 64) / 2 },
              ]}
            >
              <Text style={[styles.avatarInitialsModern, { fontSize: isSmall ? 16 : 24 }]}>
                {getInitials(data.full_name || 'Me')}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.modernRight}>
          <Text style={[styles.nameModernDark, isSmall && styles.nameSmallModern]} numberOfLines={1}>
            {data.full_name || 'Your Name'}
          </Text>
          {data.title && (
            <Text style={[styles.titleModern, isSmall && styles.titleSmall]} numberOfLines={1}>
              {data.title}
            </Text>
          )}
          {data.company && (
            <Text style={[styles.companyModern, isSmall && styles.companySmall]} numberOfLines={1}>
              {data.company}
            </Text>
          )}
          {!isSmall && (data.email || data.phone) && (
            <View style={styles.modernContactRow}>
              {data.email && (
                <Text style={styles.modernContactTextDark} numberOfLines={1}>{data.email}</Text>
              )}
              {data.phone && (
                <Text style={styles.modernContactTextDark}>{data.phone}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // Minimal Template - Soft gradient background, modern feel
  const renderMinimalTemplate = () => (
    <View style={[styles.card, styles.cardMinimal, isSmall && styles.cardSmall]}>
      <View style={styles.minimalLayout}>
        {/* Left side - Avatar */}
        <View style={styles.minimalAvatarSection}>
          {data.avatar_url ? (
            <Image
              source={{ uri: data.avatar_url }}
              style={[
                styles.avatarMinimal,
                { width: isSmall ? 44 : 68, height: isSmall ? 44 : 68, borderRadius: (isSmall ? 44 : 68) / 2 },
              ]}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholderMinimal,
                { width: isSmall ? 44 : 68, height: isSmall ? 44 : 68, borderRadius: (isSmall ? 44 : 68) / 2 },
              ]}
            >
              <Text style={[styles.avatarInitialsMinimal, { fontSize: isSmall ? 16 : 24 }]}>
                {getInitials(data.full_name || 'Me')}
              </Text>
            </View>
          )}
        </View>

        {/* Right side - Info */}
        <View style={styles.minimalInfoSection}>
          <Text style={[styles.minimalName, isSmall && styles.nameSmall]} numberOfLines={1}>
            {data.full_name || 'Your Name'}
          </Text>
          {data.title && (
            <Text style={[styles.minimalTitleStyled, isSmall && styles.titleSmall]} numberOfLines={1}>
              {data.title}
            </Text>
          )}
          {data.company && (
            <Text style={[styles.minimalCompanyStyled, isSmall && styles.companySmall]} numberOfLines={1}>
              {data.company}
            </Text>
          )}
        </View>
      </View>

      {/* Contact info at bottom */}
      {!isSmall && (data.email || data.phone) && (
        <View style={styles.minimalContactSection}>
          {data.email && (
            <View style={styles.minimalContactItem}>
              <Icon name="mail" size={12} color={colors.green[500]} />
              <Text style={styles.minimalContactTextStyled} numberOfLines={1}>{data.email}</Text>
            </View>
          )}
          {data.phone && (
            <View style={styles.minimalContactItem}>
              <Icon name="phone" size={12} color={colors.green[500]} />
              <Text style={styles.minimalContactTextStyled}>{data.phone}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  switch (data.template_id) {
    case 'modern':
      return renderModernTemplate();
    case 'gradient':
      return renderMinimalTemplate();
    default:
      return renderClassicTemplate();
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 22,
  },
  cardSmall: {
    padding: 14,
    borderRadius: 12,
  },

  // Classic Template - Warm cream/ivory theme
  cardClassic: {
    backgroundColor: '#FBF9F7',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  nameClassic: {
    color: '#3D3027',
  },
  titleClassic: {
    color: '#8B7355',
  },
  contactTextClassic: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B5B4F',
    letterSpacing: -0.2,
  },

  // Modern Template - Dark premium theme
  cardModern: {
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
    paddingLeft: 0,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modernAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  modernContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
  },
  modernLeft: {
    marginRight: 16,
  },
  modernRight: {
    flex: 1,
  },
  avatarModern: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarPlaceholderModern: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitialsModern: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  nameModernDark: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  nameSmallModern: {
    fontSize: 16,
  },
  titleModern: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.green[400],
    marginTop: 4,
  },
  companyModern: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  modernContactRow: {
    marginTop: 12,
  },
  modernContactTextDark: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
    letterSpacing: -0.2,
  },

  // Minimal Template - Soft sage/forest feel
  cardMinimal: {
    backgroundColor: colors.green[50],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.green[200],
    shadowColor: colors.green[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  minimalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimalAvatarSection: {
    marginRight: 16,
  },
  minimalInfoSection: {
    flex: 1,
  },
  avatarMinimal: {
    borderWidth: 2,
    borderColor: colors.green[500],
  },
  avatarPlaceholderMinimal: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green[100],
    borderWidth: 2,
    borderColor: colors.green[400],
  },
  avatarInitialsMinimal: {
    color: colors.green[700],
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  minimalName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.green[900],
    letterSpacing: -0.4,
  },
  minimalTitleStyled: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.green[600],
    marginTop: 4,
  },
  minimalCompanyStyled: {
    fontSize: 13,
    color: colors.green[500],
    marginTop: 2,
  },
  minimalContactSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.green[200],
    gap: 8,
  },
  minimalContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  minimalContactTextStyled: {
    fontSize: 13,
    color: colors.green[600],
    flex: 1,
  },

  // Common Styles
  avatar: {
    backgroundColor: colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  avatarInitials: {
    color: colors.smoke,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 14,
    letterSpacing: -0.4,
  },
  nameSmall: {
    fontSize: 16,
    marginTop: 8,
  },
  nameModern: {
    marginTop: 0,
    textAlign: 'left',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.green[600],
    marginTop: 4,
    letterSpacing: -0.2,
  },
  titleSmall: {
    fontSize: 12,
    marginTop: 2,
  },
  company: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.smoke,
    marginTop: 3,
    letterSpacing: -0.2,
  },
  companySmall: {
    fontSize: 11,
  },
  contactRow: {
    marginTop: 18,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.smoke,
    letterSpacing: -0.2,
  },
});
