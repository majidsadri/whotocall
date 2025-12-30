import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../styles/colors';

interface ScannedCardPreviewProps {
  imageUrl: string;
  label?: string;
  size?: 'small' | 'large';
}

export function ScannedCardPreview({
  imageUrl,
  label,
  size = 'large',
}: ScannedCardPreviewProps) {
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      {/* Simple card frame */}
      <View style={[styles.cardFrame, isSmall && styles.cardFrameSmall]}>
        {/* Card image - cover mode to fill the card area */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* Label badge */}
        {label && (
          <View style={[styles.labelBadge, isSmall && styles.labelBadgeSmall]}>
            <Text
              style={[styles.labelText, isSmall && styles.labelTextSmall]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        )}

        {/* Scanned indicator */}
        {!isSmall && (
          <View style={styles.scannedBadge}>
            <Icon name="camera" size={12} color={colors.white} />
            <Text style={styles.scannedText}>Scanned</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  containerSmall: {
    borderRadius: 12,
    shadowRadius: 6,
  },
  cardFrame: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.gray[900],
    position: 'relative',
  },
  cardFrameSmall: {
    height: 140,
    borderRadius: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  labelBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  labelBadgeSmall: {
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  labelTextSmall: {
    fontSize: 11,
  },
  scannedBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scannedText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
  },
});
