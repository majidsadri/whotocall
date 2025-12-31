import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

// QR code will be conditionally rendered if library is available
let QRCode: any = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch (e) {
  // Library not installed
}

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  backgroundColor?: string;
}

export function QRCodeDisplay({ value, size = 200, backgroundColor = colors.canvas }: QRCodeDisplayProps) {
  if (!QRCode) {
    return (
      <View style={[styles.placeholder, { width: size, height: size }]}>
        <Text style={styles.placeholderText}>QR Code</Text>
        <Text style={styles.placeholderSubtext}>Install react-native-qrcode-svg</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <QRCode
        value={value}
        size={size}
        backgroundColor={backgroundColor}
        color={colors.ink}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },
  placeholder: {
    backgroundColor: colors.muted,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: colors.misty,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.smoke,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: colors.smoke,
    marginTop: 4,
  },
});
