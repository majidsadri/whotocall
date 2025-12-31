import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/colors';

interface AppHeaderProps {
  onLoginPress: () => void;
  onProfilePress: () => void;
}

function AnimatedLogo() {
  // Card animations
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardRotateY = useRef(new Animated.Value(0)).current;
  const cardTranslateX = useRef(new Animated.Value(-8)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // Phone animations
  const phoneOpacity = useRef(new Animated.Value(0.2)).current;
  const phoneScale = useRef(new Animated.Value(0.9)).current;
  const phoneGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        // Phase 1: Card floats gently
        Animated.parallel([
          Animated.timing(cardTranslateX, {
            toValue: -6,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),

        // Phase 2: Card flies toward phone with flip
        Animated.parallel([
          Animated.timing(cardRotateY, {
            toValue: 1,
            duration: 700,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(cardTranslateX, {
            toValue: 12,
            duration: 700,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 0.3,
            duration: 700,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 0,
            duration: 500,
            delay: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          // Phone wakes up
          Animated.timing(phoneOpacity, {
            toValue: 1,
            duration: 400,
            delay: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(phoneScale, {
            toValue: 1,
            duration: 400,
            delay: 300,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
        ]),

        // Phase 3: Phone pulses with glow
        Animated.sequence([
          Animated.parallel([
            Animated.timing(phoneGlow, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(phoneScale, {
              toValue: 1.15,
              duration: 200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(phoneGlow, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(phoneScale, {
              toValue: 1,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          // Second smaller pulse
          Animated.parallel([
            Animated.timing(phoneGlow, {
              toValue: 0.7,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(phoneScale, {
              toValue: 1.08,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(phoneGlow, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(phoneScale, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),

        // Hold
        Animated.delay(1000),

        // Phase 4: Reset smoothly
        Animated.parallel([
          Animated.timing(phoneOpacity, {
            toValue: 0.2,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(phoneScale, {
            toValue: 0.9,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 500,
            delay: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardRotateY, {
            toValue: 0,
            duration: 500,
            delay: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardTranslateX, {
            toValue: -8,
            duration: 500,
            delay: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 1,
            duration: 500,
            delay: 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),

        // Pause before loop
        Animated.delay(800),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, []);

  const rotateInterpolate = cardRotateY.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.logoContainer}>
      {/* Phone (background) */}
      <Animated.View
        style={[
          styles.phoneWrapper,
          {
            opacity: phoneOpacity,
            transform: [{ scale: phoneScale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.phoneGlow,
            { opacity: phoneGlow },
          ]}
        />
        <Icon name="smartphone" size={22} color={colors.white} />
      </Animated.View>

      {/* Business Card (foreground) */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: cardOpacity,
            transform: [
              { translateX: cardTranslateX },
              { rotateY: rotateInterpolate },
              { scale: cardScale },
            ],
          },
        ]}
      >
        <View style={styles.cardIcon}>
          <View style={styles.cardAvatar} />
          <View style={styles.cardLines}>
            <View style={styles.cardLine} />
            <View style={styles.cardLineShort} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function AppHeader({ onLoginPress, onProfilePress }: AppHeaderProps) {
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      {/* Left: Animated Logo + Brand Text */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBox}>
          <AnimatedLogo />
        </View>
        <Text style={styles.brandText}>reachr</Text>
      </View>

      {/* Right: Profile/Login */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={user ? onProfilePress : onLoginPress}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {user ? (
          getAvatarUrl() ? (
            <Image source={{ uri: getAvatarUrl() }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="user" size={16} color={colors.white} />
            </View>
          )
        ) : (
          <View style={styles.loginIcon}>
            <Icon name="log-in" size={18} color={colors.white} />
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
    paddingBottom: 14,
    backgroundColor: colors.gray[800],
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneGlow: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    opacity: 0.4,
  },
  cardWrapper: {
    position: 'absolute',
  },
  cardIcon: {
    width: 22,
    height: 16,
    backgroundColor: colors.white,
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cardAvatar: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green[500],
  },
  cardLines: {
    flex: 1,
    gap: 2,
  },
  cardLine: {
    width: '100%',
    height: 2,
    backgroundColor: colors.gray[400],
    borderRadius: 1,
  },
  cardLineShort: {
    width: '60%',
    height: 2,
    backgroundColor: colors.gray[300],
    borderRadius: 1,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
