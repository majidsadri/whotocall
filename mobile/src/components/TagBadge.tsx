import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

type TagVariant = 'green' | 'blue' | 'purple' | 'orange' | 'gray';

interface TagBadgeProps {
  label: string;
  variant?: TagVariant;
}

const variantStyles: Record<TagVariant, { bg: string; border: string; text: string }> = {
  green: {
    bg: colors.green[50],
    border: colors.green[100],
    text: colors.green[700],
  },
  blue: {
    bg: colors.blue[50],
    border: colors.blue[100],
    text: colors.blue[700],
  },
  purple: {
    bg: colors.purple[50],
    border: colors.purple[100],
    text: colors.purple[700],
  },
  orange: {
    bg: colors.orange[50],
    border: colors.orange[100],
    text: colors.orange[700],
  },
  gray: {
    bg: colors.gray[100],
    border: colors.gray[200],
    text: colors.gray[600],
  },
};

export default function TagBadge({ label, variant = 'green' }: TagBadgeProps) {
  const style = variantStyles[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: style.bg, borderColor: style.border },
      ]}
    >
      <Text style={[styles.text, { color: style.text }]}>{label}</Text>
    </View>
  );
}

// Get variant by index for cycling through colors
export function getTagVariant(index: number): TagVariant {
  const variants: TagVariant[] = ['green', 'blue', 'purple', 'orange'];
  return variants[index % variants.length];
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
