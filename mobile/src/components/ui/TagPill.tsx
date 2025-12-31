import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Radii } from '../../styles/theme';

interface TagPillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
  style?: ViewStyle;
}

export function TagPill({
  label,
  selected = false,
  onPress,
  count,
  style,
}: TagPillProps) {
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        selected && styles.pillSelected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {selected && (
        <Icon name="check" size={12} color={Colors.white} />
      )}
      <Text
        style={[
          styles.text,
          selected && styles.textSelected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <Text
          style={[
            styles.count,
            selected && styles.countSelected,
          ]}
        >
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.misty,
  },
  pillSelected: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.smoke,
  },
  textSelected: {
    color: Colors.white,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.smoke,
    marginLeft: 2,
  },
  countSelected: {
    color: Colors.white,
    opacity: 0.8,
  },
});
