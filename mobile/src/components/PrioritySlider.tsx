import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '../styles/colors';

interface PrioritySliderProps {
  value: number;
  onChange: (value: number) => void;
  showLabels?: boolean;
}

function getPriorityInfo(value: number): { label: string; color: string } {
  if (value >= 67) return { label: 'High', color: colors.green[700] };
  if (value >= 34) return { label: 'Medium', color: colors.green[500] };
  return { label: 'Low', color: colors.green[400] };
}

export default function PrioritySlider({
  value,
  onChange,
  showLabels = true,
}: PrioritySliderProps) {
  const priorityInfo = getPriorityInfo(value);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.labelText}>Priority</Text>
        <Text style={[styles.valueText, { color: priorityInfo.color }]}>
          {priorityInfo.label}
        </Text>
      </View>

      {/* Progress bar visualization */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${value}%` },
            ]}
          />
        </View>
      </View>

      {/* Slider */}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.transparent}
        maximumTrackTintColor={colors.transparent}
        thumbTintColor={colors.green[500]}
      />

      {/* Labels */}
      {showLabels && (
        <View style={styles.labelsContainer}>
          <Text style={styles.labelSmall}>Low</Text>
          <Text style={styles.labelSmall}>Medium</Text>
          <Text style={styles.labelSmall}>High</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    color: colors.gray[400],
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.green[500],
    borderRadius: 4,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: -20,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  labelSmall: {
    fontSize: 10,
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
