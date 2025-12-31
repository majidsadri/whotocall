import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

interface TagBadgeProps {
  label: string;
  active?: boolean;
}

export default function TagBadge({ label, active = false }: TagBadgeProps) {
  return (
    <View
      style={[
        styles.container,
        active ? styles.active : styles.inactive,
      ]}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
        {label}
      </Text>
    </View>
  );
}

// Legacy function for backwards compatibility - now returns undefined since we use active prop
export function getTagVariant(_index: number): undefined {
  return undefined;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  inactive: {
    backgroundColor: colors.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  active: {
    backgroundColor: colors.ink,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ink,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  textInactive: {
    color: colors.smoke,
  },
  textActive: {
    color: colors.white,
  },
});
