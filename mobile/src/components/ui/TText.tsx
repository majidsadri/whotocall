import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors, Type } from '../../styles/theme';

type TextVariant = 'largeTitle' | 'headline' | 'body' | 'bodySecondary' | 'caption' | 'micro';

interface TTextProps {
  variant?: TextVariant;
  color?: string;
  style?: TextStyle;
  children: React.ReactNode;
  numberOfLines?: number;
}

export function TText({
  variant = 'body',
  color,
  style,
  children,
  numberOfLines,
}: TTextProps) {
  const variantStyle = Type[variant];

  return (
    <Text
      style={[
        variantStyle,
        color && { color },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

// Convenience components
export function LargeTitle({ children, style, ...props }: Omit<TTextProps, 'variant'>) {
  return <TText variant="largeTitle" style={style} {...props}>{children}</TText>;
}

export function Headline({ children, style, ...props }: Omit<TTextProps, 'variant'>) {
  return <TText variant="headline" style={style} {...props}>{children}</TText>;
}

export function Body({ children, style, ...props }: Omit<TTextProps, 'variant'>) {
  return <TText variant="body" style={style} {...props}>{children}</TText>;
}

export function Caption({ children, style, ...props }: Omit<TTextProps, 'variant'>) {
  return <TText variant="caption" style={style} {...props}>{children}</TText>;
}

export function MicroLabel({ children, style, ...props }: Omit<TTextProps, 'variant'>) {
  return <TText variant="micro" style={style} {...props}>{children}</TText>;
}
