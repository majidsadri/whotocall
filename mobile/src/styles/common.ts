import { StyleSheet } from 'react-native';
import { colors } from './colors';

// Ghost & Carbon Typography
export const typography = {
  // Large Title - Hero text
  displayLarge: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    lineHeight: 40,
    color: colors.ink,
  },
  // Page titles
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
    lineHeight: 34,
    color: colors.ink,
  },
  // Section headers
  headline: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.4,
    lineHeight: 26,
    color: colors.ink,
  },
  // Body text
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 24,
    color: colors.ink,
  },
  // Secondary body
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
    lineHeight: 20,
    color: colors.smoke,
  },
  // Captions
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
    lineHeight: 18,
    color: colors.smoke,
  },
  // Micro labels (uppercase)
  micro: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
    color: colors.smoke,
  },
};

export const commonStyles = StyleSheet.create({
  // ==========================================================================
  // CONTAINERS
  // ==========================================================================
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  // ==========================================================================
  // CARDS - With subtle shadow for visibility
  // ==========================================================================
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: 'hidden',
    // Subtle shadow for depth
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },

  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // ==========================================================================
  // BUTTONS - Pill style (NO shadows)
  // ==========================================================================

  // Primary: Carbon black
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.ink,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 9999, // Pill
    // NO shadows
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },

  btnPrimaryText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Secondary: White + hairline
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 9999, // Pill
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },

  btnSecondaryText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999,
  },

  btnGhostText: {
    color: colors.smoke,
    fontSize: 14,
    fontWeight: '500',
  },

  btnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },

  btnDisabled: {
    opacity: 0.4,
  },

  // ==========================================================================
  // INPUTS - Underline style
  // ==========================================================================
  input: {
    height: 52,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.misty,
    borderRadius: 0,
    fontSize: 17,
    fontWeight: '400',
    color: colors.ink,
    letterSpacing: 0,
  },

  inputFocused: {
    borderBottomColor: colors.accent,
  },

  textarea: {
    minHeight: 110,
    paddingHorizontal: 0,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.misty,
    borderRadius: 0,
    fontSize: 17,
    fontWeight: '400',
    color: colors.ink,
    textAlignVertical: 'top',
    lineHeight: 24,
  },

  // ==========================================================================
  // LABELS - Micro style
  // ==========================================================================
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.smoke,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.smoke,
    marginTop: 4,
    letterSpacing: -0.1,
  },

  // ==========================================================================
  // TAGS - Monochrome pills
  // ==========================================================================
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },

  tagActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },

  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.smoke,
  },

  tagTextActive: {
    color: colors.white,
  },

  // ==========================================================================
  // BADGES
  // ==========================================================================
  badge: {
    height: 24,
    paddingHorizontal: 10,
    backgroundColor: colors.muted,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.misty,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.smoke,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  badgeGreen: {
    backgroundColor: colors.green[50],
    borderColor: colors.green[200],
  },

  badgeGreenText: {
    color: colors.green[700],
  },

  // ==========================================================================
  // LAYOUT
  // ==========================================================================
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Spacing
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },

  // ==========================================================================
  // ICONS
  // ==========================================================================
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },

  iconContainerGreen: {
    backgroundColor: colors.accent,
  },

  iconContainerGray: {
    backgroundColor: colors.muted,
  },

  // ==========================================================================
  // ERROR STATES
  // ==========================================================================
  errorContainer: {
    backgroundColor: colors.red[50],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.red[200],
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.danger,
    flex: 1,
    lineHeight: 20,
  },

  // ==========================================================================
  // LOADING
  // ==========================================================================
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },

  // ==========================================================================
  // DIVIDER - Hairline
  // ==========================================================================
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.misty,
    marginVertical: 16,
  },
});
