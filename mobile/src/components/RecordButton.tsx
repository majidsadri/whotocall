import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../styles/colors';

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing?: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

export default function RecordButton({
  isRecording,
  isProcessing = false,
  onPress,
  disabled = false,
  size = 56,
}: RecordButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isProcessing}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        isRecording && styles.recording,
        isProcessing && styles.processing,
        disabled && styles.disabled,
      ]}
    >
      {isProcessing ? (
        <ActivityIndicator color={colors.smoke} size="small" />
      ) : (
        <View style={[styles.iconWrapper, isRecording && styles.iconWrapperRecording]}>
          <Icon
            name="mic"
            size={size * 0.4}
            color={isRecording ? colors.white : colors.smoke}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperRecording: {
    // Optional: add subtle animation indicator
  },
  recording: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  processing: {
    backgroundColor: colors.muted,
    borderColor: colors.misty,
  },
  disabled: {
    opacity: 0.4,
  },
});
