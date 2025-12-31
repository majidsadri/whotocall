import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../styles/theme';

interface HairlineProps {
  style?: ViewStyle;
  color?: string;
}

export function Hairline({ style, color }: HairlineProps) {
  return (
    <View
      style={[
        styles.hairline,
        color && { backgroundColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.misty,
  },
});
