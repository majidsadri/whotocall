import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Spacing } from '../../styles/theme';

interface InputUnderlineProps extends TextInputProps {
  label?: string;
}

export function InputUnderline({ label, style, ...props }: InputUnderlineProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          style,
        ]}
        placeholderTextColor={Colors.smoke}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.smoke,
    marginBottom: 8,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontSize: 17,
    fontWeight: '400',
    color: Colors.ink,
    borderWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.misty,
    backgroundColor: 'transparent',
  },
  inputFocused: {
    borderBottomColor: Colors.accent,
  },
});
