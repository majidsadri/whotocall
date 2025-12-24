import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // Pulse animation when recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 3,
          transform: [{ scale: pulseAnim }],
        },
        isRecording && styles.recording,
        isProcessing && styles.processing,
        disabled && styles.disabled,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || isProcessing}
        style={styles.button}
        activeOpacity={0.8}
      >
        {isProcessing ? (
          <ActivityIndicator color={colors.gray[500]} size="small" />
        ) : (
          <Icon
            name="mic"
            size={size * 0.4}
            color={isRecording ? colors.white : colors.white}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recording: {
    backgroundColor: colors.red[500],
    shadowColor: colors.red[500],
    shadowOpacity: 0.5,
  },
  processing: {
    backgroundColor: colors.gray[200],
    shadowColor: colors.gray[300],
    shadowOpacity: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
