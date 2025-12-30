import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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

  const renderAvatar = (avatarSize: number, textSize: number, bgColor: string = colors.purple[600]) => {
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
            backgroundColor: bgColor,
          },
        ]}
      >
        <Text style={[styles.avatarInitials, { fontSize: textSize }]}>
          {getInitials(data.full_name || 'Me')}
        </Text>
      </View>
    );
  };

  // Classic Template
  const renderClassicTemplate = () => (
    <View style={[styles.card, styles.cardClassic, isSmall && styles.cardSmall]}>
      {renderAvatar(isSmall ? 48 : 80, isSmall ? 18 : 28)}
      <Text style={[styles.name, isSmall && styles.nameSmall]} numberOfLines={1}>
        {data.full_name || 'Your Name'}
      </Text>
      {data.title && (
        <Text style={[styles.title, isSmall && styles.titleSmall]} numberOfLines={1}>
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
              <Icon name="mail" size={14} color={colors.gray[400]} />
              <Text style={styles.contactText} numberOfLines={1}>{data.email}</Text>
            </View>
          )}
          {data.phone && (
            <View style={styles.contactItem}>
              <Icon name="phone" size={14} color={colors.gray[400]} />
              <Text style={styles.contactText}>{data.phone}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  // Modern Template
  const renderModernTemplate = () => (
    <View style={[styles.card, styles.cardModern, isSmall && styles.cardSmall]}>
      <View style={[styles.modernAccent, { backgroundColor: data.accent_color || colors.purple[600] }]} />
      <View style={styles.modernContent}>
        <View style={styles.modernLeft}>
          {renderAvatar(isSmall ? 40 : 64, isSmall ? 16 : 24, data.accent_color || colors.purple[600])}
        </View>
        <View style={styles.modernRight}>
          <Text style={[styles.name, styles.nameModern, isSmall && styles.nameSmall]} numberOfLines={1}>
            {data.full_name || 'Your Name'}
          </Text>
          {data.title && (
            <Text style={[styles.title, isSmall && styles.titleSmall]} numberOfLines={1}>
              {data.title}
            </Text>
          )}
          {data.company && (
            <Text style={[styles.company, isSmall && styles.companySmall]} numberOfLines={1}>
              {data.company}
            </Text>
          )}
          {!isSmall && (data.email || data.phone) && (
            <View style={styles.modernContactRow}>
              {data.email && (
                <Text style={styles.modernContactText} numberOfLines={1}>{data.email}</Text>
              )}
              {data.phone && (
                <Text style={styles.modernContactText}>{data.phone}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // Gradient Template - Premium Dark Design
  const renderGradientTemplate = () => (
    <View style={[styles.cardGradientWrapper, isSmall && styles.cardSmall]}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.cardGradient]}
      >
        {/* Decorative accent line */}
        <LinearGradient
          colors={['#00d4ff', '#7c3aed', '#f472b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientAccentLine}
        />

        {/* Content */}
        <View style={styles.gradientLayout}>
          {/* Left side - Avatar */}
          <View style={styles.gradientAvatarSection}>
            {data.avatar_url ? (
              <View style={styles.gradientAvatarRing}>
                <Image
                  source={{ uri: data.avatar_url }}
                  style={[
                    styles.gradientAvatar,
                    { width: isSmall ? 44 : 68, height: isSmall ? 44 : 68, borderRadius: isSmall ? 22 : 34 },
                  ]}
                />
              </View>
            ) : (
              <LinearGradient
                colors={['#7c3aed', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.gradientAvatarPlaceholder,
                  {
                    width: isSmall ? 48 : 72,
                    height: isSmall ? 48 : 72,
                    borderRadius: isSmall ? 24 : 36,
                  },
                ]}
              >
                <Text style={[styles.avatarInitials, { fontSize: isSmall ? 16 : 24 }]}>
                  {getInitials(data.full_name || 'Me')}
                </Text>
              </LinearGradient>
            )}
          </View>

          {/* Right side - Info */}
          <View style={styles.gradientInfoSection}>
            <Text style={[styles.gradientName, isSmall && styles.nameSmall]} numberOfLines={1}>
              {data.full_name || 'Your Name'}
            </Text>
            {data.title && (
              <Text style={[styles.gradientTitle, isSmall && styles.titleSmall]} numberOfLines={1}>
                {data.title}
              </Text>
            )}
            {data.company && (
              <Text style={[styles.gradientCompany, isSmall && styles.companySmall]} numberOfLines={1}>
                {data.company}
              </Text>
            )}
          </View>
        </View>

        {/* Contact info at bottom */}
        {!isSmall && (data.email || data.phone) && (
          <View style={styles.gradientContactSection}>
            {data.email && (
              <View style={styles.gradientContactItem}>
                <View style={styles.gradientIconBox}>
                  <Icon name="mail" size={12} color="#00d4ff" />
                </View>
                <Text style={styles.gradientContactText} numberOfLines={1}>{data.email}</Text>
              </View>
            )}
            {data.phone && (
              <View style={styles.gradientContactItem}>
                <View style={styles.gradientIconBox}>
                  <Icon name="phone" size={12} color="#00d4ff" />
                </View>
                <Text style={styles.gradientContactText}>{data.phone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Decorative dots */}
        <View style={styles.decorativeDots}>
          <View style={[styles.dot, { backgroundColor: '#7c3aed' }]} />
          <View style={[styles.dot, { backgroundColor: '#06b6d4' }]} />
          <View style={[styles.dot, { backgroundColor: '#f472b6' }]} />
        </View>
      </LinearGradient>
    </View>
  );

  switch (data.template_id) {
    case 'modern':
      return renderModernTemplate();
    case 'gradient':
      return renderGradientTemplate();
    default:
      return renderClassicTemplate();
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 22,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  cardSmall: {
    padding: 14,
    borderRadius: 14,
  },

  // Classic Template
  cardClassic: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // Modern Template
  cardModern: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    paddingLeft: 0,
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
    paddingLeft: 18,
  },
  modernLeft: {
    marginRight: 14,
  },
  modernRight: {
    flex: 1,
  },
  modernContactRow: {
    marginTop: 10,
  },
  modernContactText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[400],
    marginBottom: 3,
    letterSpacing: -0.2,
  },

  // Gradient Template - Premium
  cardGradientWrapper: {
    borderRadius: 20,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gradientAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  gradientLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  gradientAvatarSection: {
    marginRight: 16,
  },
  gradientAvatarRing: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.5)',
  },
  gradientAvatar: {
    backgroundColor: '#1a1a2e',
  },
  gradientAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientInfoSection: {
    flex: 1,
  },
  gradientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  gradientTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00d4ff',
    marginTop: 4,
  },
  gradientCompany: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  gradientContactSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  gradientContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gradientIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientContactText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  decorativeDots: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },

  // Common Styles
  avatar: {
    backgroundColor: colors.gray[700],
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
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
    color: colors.purple[400],
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
    color: colors.gray[400],
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
    color: colors.gray[400],
    letterSpacing: -0.2,
  },
});
