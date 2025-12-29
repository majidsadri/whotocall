import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from './AppHeader';
import LoginModal from './LoginModal';
import ProfileModal from './ProfileModal';
import { colors } from '../styles/colors';

interface ScreenWrapperProps {
  children: React.ReactNode;
}

export default function ScreenWrapper({ children }: ScreenWrapperProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        onLoginPress={() => setShowLoginModal(true)}
        onProfilePress={() => setShowProfileModal(true)}
      />
      <View style={styles.content}>{children}</View>

      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
