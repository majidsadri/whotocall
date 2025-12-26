import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const commonStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // Cards - Dark mode elevated style
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginBottom: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },

  cardContent: {
    padding: 20,
  },

  // Buttons - Primary with glow effect
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },

  btnPrimaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  btnSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },

  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },

  btnGhostText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },

  btnIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  btnDisabled: {
    opacity: 0.5,
  },

  // Inputs - Dark mode style
  input: {
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    fontSize: 15,
    color: colors.text,
  },

  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  textarea: {
    minHeight: 110,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
    lineHeight: 22,
  },

  // Labels - Refined typography
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Tags - Pill style with cyan accent
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    backgroundColor: colors.cyan[900],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cyan[700],
  },

  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.cyan[300],
  },

  // Badges - Modern pill badges
  badge: {
    height: 24,
    paddingHorizontal: 10,
    backgroundColor: colors.gray[800],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  badgeGreen: {
    backgroundColor: colors.cyan[900],
    borderWidth: 1,
    borderColor: colors.cyan[700],
  },

  badgeGreenText: {
    color: colors.cyan[400],
  },

  // Row layouts
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

  // Icon containers - Enhanced for dark mode
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainerGreen: {
    backgroundColor: colors.primary,
  },

  iconContainerGray: {
    backgroundColor: colors.gray[800],
  },

  // Error states - Dark mode style
  errorContainer: {
    backgroundColor: colors.red[900],
    borderWidth: 1,
    borderColor: colors.red[700],
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  errorText: {
    fontSize: 14,
    color: colors.red[300],
    flex: 1,
    lineHeight: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
});
