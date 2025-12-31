import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { Hairline } from './Hairline';
import { Colors, Spacing } from '../../styles/theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showDivider?: boolean;
}

export const ListRow = memo(function ListRow({
  title,
  subtitle,
  imageUrl,
  onPress,
  rightElement,
  showDivider = true,
}: ListRowProps) {
  const content = (
    <>
      <View style={styles.row}>
        <Avatar imageUrl={imageUrl} name={title} size="medium" />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightElement}
      </View>
      {showDivider && <Hairline style={styles.divider} />}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View>{content}</View>;
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.smoke,
    marginTop: 2,
  },
  divider: {
    marginLeft: 48 + Spacing.sm, // Avatar width + gap
  },
});
