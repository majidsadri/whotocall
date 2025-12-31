import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import AppHeader from './AppHeader';
import LoginModal from './LoginModal';
import ProfileModal from './ProfileModal';
import { useLoginModal } from '../context/LoginModalContext';
import { colors } from '../styles/colors';

interface ScreenWrapperProps {
  children: React.ReactNode;
}

export default function ScreenWrapper({ children }: ScreenWrapperProps) {
  const { isLoginModalVisible, openLoginModal, closeLoginModal } = useLoginModal();
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green[900]} translucent />
      <AppHeader
        onLoginPress={openLoginModal}
        onProfilePress={() => setShowProfileModal(true)}
      />
      <View style={styles.content}>{children}</View>

      <LoginModal
        visible={isLoginModalVisible}
        onClose={closeLoginModal}
      />
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </View>
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
