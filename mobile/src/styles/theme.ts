import { StyleSheet, TextStyle } from 'react-native';

// Ghost & Carbon Design System
// Editorial Minimalism - Light mode, 2D, typography-first

// =============================================================================
// COLORS
// =============================================================================
export const Colors = {
  // Core palette
  canvas: '#FFFFFF',      // Primary background
  muted: '#F9F9FB',       // Inputs, subtle blocks
  ink: '#111111',         // Primary text
  smoke: '#6B7280',       // Secondary text
  misty: '#EEEEEE',       // Hairlines, borders
  accent: '#10B981',      // Micro-interactions only (Emerald Green)
  danger: '#DC2626',      // Destructive actions

  // Semantic aliases
  background: '#FFFFFF',
  surface: '#F9F9FB',
  text: '#111111',
  textSecondary: '#6B7280',
  border: '#EEEEEE',
  primary: '#10B981',
  error: '#DC2626',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================
export const Type = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: Colors.ink,
  } as TextStyle,

  headline: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: Colors.ink,
  } as TextStyle,

  body: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0,
    color: Colors.ink,
  } as TextStyle,

  bodySecondary: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0,
    color: Colors.smoke,
  } as TextStyle,

  microLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.smoke,
  } as TextStyle,

  caption: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.smoke,
  } as TextStyle,

  button: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  } as TextStyle,
} as const;

// =============================================================================
// SPACING
// =============================================================================
export const Spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  screenGutter: 24,
} as const;

// =============================================================================
// RADII
// =============================================================================
export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 9999,
} as const;

// =============================================================================
// SHADOWS (None - 2D design)
// =============================================================================
export const noShadow = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
} as const;

// =============================================================================
// HAIRLINE
// =============================================================================
export const hairlineStyle = {
  height: StyleSheet.hairlineWidth,
  backgroundColor: Colors.misty,
} as const;

// =============================================================================
// MOTION
// =============================================================================
export const Motion = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  easing: 'ease-out',
} as const;

// =============================================================================
// COMMON STYLES
// =============================================================================
export const themeStyles = StyleSheet.create({
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
    paddingHorizontal: Spacing.screenGutter,
  },

  // Hairline divider
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.misty,
  },

  // Primary button (Carbon)
  btnPrimary: {
    backgroundColor: Colors.ink,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...noShadow,
  },

  btnPrimaryText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Secondary button (White + hairline)
  btnSecondary: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.misty,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...noShadow,
  },

  btnSecondaryText: {
    color: Colors.ink,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Underlined input
  inputUnderline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.misty,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: '400',
    color: Colors.ink,
  },

  // Tag pill (inactive)
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.misty,
    backgroundColor: Colors.white,
  },

  tagPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.smoke,
  },

  // Tag pill (active)
  tagPillActive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 0,
    backgroundColor: Colors.ink,
  },

  tagPillActiveText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },

  // Avatar
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.misty,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.misty,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List row
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },

  // Card (minimal - just hairline border)
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.misty,
    padding: Spacing.md,
    ...noShadow,
  },
});
