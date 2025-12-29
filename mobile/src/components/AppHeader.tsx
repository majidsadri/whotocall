import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/colors';
import ReachrLogo from './ReachrLogo';

interface AppHeaderProps {
  onLoginPress: () => void;
  onProfilePress: () => void;
}

export default function AppHeader({ onLoginPress, onProfilePress }: AppHeaderProps) {
  const { user, isLoading } = useAuth();

  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  return (
    <View style={styles.header}>
      {/* Left: Logo + Brand */}
      <View style={styles.brandRow}>
        <ReachrLogo size="small" showText={false} />
        <View style={styles.brandTextContainer}>
          <Text style={styles.brandLetter1}>r</Text>
          <Text style={styles.brandLetter2}>e</Text>
          <Text style={styles.brandLetter3}>a</Text>
          <Text style={styles.brandLetter4}>c</Text>
          <Text style={styles.brandLetter5}>h</Text>
          <Text style={styles.brandLetter6}>r</Text>
        </View>
      </View>

      {/* Right: Profile/Login */}
      <TouchableOpacity
        style={styles.authButton}
        onPress={user ? onProfilePress : onLoginPress}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {user ? (
          getAvatarUrl() ? (
            <Image source={{ uri: getAvatarUrl() }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="user" size={18} color={colors.white} />
            </View>
          )
        ) : (
          <View style={styles.loginButton}>
            <Icon name="log-in" size={20} color={colors.cyan[400]} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLetter1: {
    fontSize: 22,
    fontWeight: '800',
    color: '#C084FC',
    textShadowColor: '#A855F7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: 0.5,
  },
  brandLetter2: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D8B4FE',
    textShadowColor: '#C084FC',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 0.5,
  },
  brandLetter3: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E9D5FF',
    textShadowColor: '#D8B4FE',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 0.5,
  },
  brandLetter4: {
    fontSize: 22,
    fontWeight: '800',
    color: '#A5F3FC',
    textShadowColor: '#67E8F9',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 0.5,
  },
  brandLetter5: {
    fontSize: 22,
    fontWeight: '800',
    color: '#67E8F9',
    textShadowColor: '#22D3EE',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 0.5,
  },
  brandLetter6: {
    fontSize: 22,
    fontWeight: '800',
    color: '#22D3EE',
    textShadowColor: '#06B6D4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: 0.5,
  },
  authButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.purple[500],
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.purple[500],
  },
  loginButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
