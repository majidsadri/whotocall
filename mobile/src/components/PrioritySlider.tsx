import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../styles/colors';

interface PrioritySliderProps {
  value: number;
  onChange: (value: number) => void;
  showLabels?: boolean;
}

type PriorityLevel = 'low' | 'medium' | 'high';

function getPriorityLevel(value: number): PriorityLevel {
  if (value >= 67) return 'high';
  if (value >= 34) return 'medium';
  return 'low';
}

const priorityConfig = {
  low: {
    label: 'Low',
    value: 17,
    color: colors.green[400],
    bgColor: '#F0FDF4', // Very light green tint
    borderColor: colors.green[300],
  },
  medium: {
    label: 'Medium',
    value: 50,
    color: colors.green[500],
    bgColor: '#ECFDF5', // Slightly more green
    borderColor: colors.green[400],
  },
  high: {
    label: 'High',
    value: 83,
    color: colors.green[600],
    bgColor: '#D1FAE5', // More noticeable green
    borderColor: colors.green[500],
  },
};

export default function PrioritySlider({
  value,
  onChange,
}: PrioritySliderProps) {
  const currentLevel = getPriorityLevel(value);

  const handleSelect = (level: PriorityLevel) => {
    onChange(priorityConfig[level].value);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.labelText}>Priority</Text>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        {(['low', 'medium', 'high'] as PriorityLevel[]).map((level) => {
          const config = priorityConfig[level];
          const isActive = currentLevel === level;

          return (
            <TouchableOpacity
              key={level}
              style={[
                styles.segment,
                isActive && styles.segmentActive,
                isActive && { backgroundColor: config.bgColor, borderColor: config.borderColor },
              ]}
              onPress={() => handleSelect(level)}
              activeOpacity={0.7}
            >
              <View style={[styles.indicator, { backgroundColor: config.color }]} />
              <Text
                style={[
                  styles.segmentText,
                  isActive && { color: config.color, fontWeight: '600' },
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[400],
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    marginHorizontal: 5,
  },
  segmentActive: {
    borderWidth: 1.5,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  segmentText: {
    fontSize: 14,
    color: colors.smoke,
    fontWeight: '500',
  },
});
