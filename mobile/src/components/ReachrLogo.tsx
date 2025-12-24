import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ReachrLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'default' | 'cyan';
}

export default function ReachrLogo({ size = 'medium', showText = true, variant = 'default' }: ReachrLogoProps) {
  const scale = size === 'small' ? 0.7 : size === 'large' ? 1.5 : 1;
  const isCyan = variant === 'cyan';
  const mainColor = isCyan ? CYAN : PURPLE;
  const lightColor = isCyan ? CYAN_LIGHT : PURPLE_LIGHT;

  return (
    <View style={styles.container}>
      {/* Circles in a straight horizontal line */}
      <View style={[styles.logoMark, { transform: [{ scale }] }]}>
        {/* Tiny dot */}
        <View style={[styles.circle, styles.circle1, { backgroundColor: mainColor }]} />
        {/* Small dot */}
        <View style={[styles.circle, styles.circle2, { backgroundColor: mainColor }]} />
        {/* Medium dot */}
        <View style={[styles.circle, styles.circle3, { backgroundColor: mainColor }]} />
        {/* Larger dot */}
        <View style={[styles.circle, styles.circle4, { backgroundColor: mainColor }]} />
        {/* Big ball */}
        <View style={[styles.circle, styles.circle5, { backgroundColor: lightColor, shadowColor: mainColor }]} />
      </View>

      {/* Text */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.logoText, { fontSize: 32 * scale, color: mainColor }]}>reachr</Text>
          <View style={[styles.textUnderline, { backgroundColor: lightColor }]} />
        </View>
      )}
    </View>
  );
}

const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#A78BFA';
const CYAN = '#06B6D4';
const CYAN_LIGHT = '#22D3EE';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoMark: {
    width: 120,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  circle: {
    backgroundColor: PURPLE,
    borderRadius: 50,
    marginHorizontal: 3,
  },
  // Straight line - small to large
  circle1: {
    width: 6,
    height: 6,
    opacity: 0.3,
  },
  circle2: {
    width: 10,
    height: 10,
    opacity: 0.45,
  },
  circle3: {
    width: 14,
    height: 14,
    opacity: 0.6,
  },
  circle4: {
    width: 18,
    height: 18,
    opacity: 0.8,
  },
  circle5: {
    width: 26,
    height: 26,
    backgroundColor: PURPLE_LIGHT,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  textContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontWeight: '700',
    letterSpacing: 6,
    textTransform: 'lowercase',
  },
  textUnderline: {
    height: 3,
    width: 60,
    borderRadius: 2,
    marginTop: 4,
  },
});
