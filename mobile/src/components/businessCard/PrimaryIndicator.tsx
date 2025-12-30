import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../styles/colors';

interface PrimaryIndicatorProps {
  size?: 'small' | 'medium' | 'large';
}

export function PrimaryIndicator({ size = 'medium' }: PrimaryIndicatorProps) {
  const dimensions = {
    small: { container: 20, icon: 10 },
    medium: { container: 28, icon: 14 },
    large: { container: 36, icon: 18 },
  };

  const { container, icon } = dimensions[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: container,
          height: container,
          borderRadius: container / 2,
        },
      ]}
    >
      <Icon name="star" size={icon} color={colors.yellow[400]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },
});
