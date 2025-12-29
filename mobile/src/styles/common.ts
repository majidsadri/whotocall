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

  // Cards - Premium glassmorphism style
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },

  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },

  // Buttons - Premium with glow effect
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.purple[600],
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: colors.purple[600],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  btnPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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

  // Inputs - Premium dark style
  input: {
    height: 54,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    fontSize: 16,
    color: colors.text,
  },

  inputFocused: {
    borderColor: colors.purple[500],
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    shadowColor: colors.purple[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },

  textarea: {
    minHeight: 120,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
    lineHeight: 24,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 3,
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

  // Badges - Premium pill badges
  badge: {
    height: 26,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  badgeGreen: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
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
