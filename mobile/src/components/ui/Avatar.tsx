import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../styles/theme';

type AvatarSize = 'small' | 'medium' | 'large';

interface AvatarProps {
  imageUrl?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const SIZES = {
  small: 36,
  medium: 48,
  large: 120,
};

const FONT_SIZES = {
  small: 14,
  medium: 18,
  large: 40,
};

export function Avatar({
  imageUrl,
  name,
  size = 'medium',
  style,
}: AvatarProps) {
  const dimension = SIZES[size];
  const fontSize = FONT_SIZES[size];
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  const containerStyle = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
    },
    style,
  ];

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[containerStyle, styles.image]}
      />
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.misty,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  initial: {
    fontWeight: '600',
    color: Colors.smoke,
  },
});
