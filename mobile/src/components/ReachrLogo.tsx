import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface ReachrLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  animated?: boolean;
}

export default function ReachrLogo({ size = 'medium', showText = true, animated = true }: ReachrLogoProps) {
  const scale = size === 'small' ? 0.7 : size === 'large' ? 1.5 : 1;

  // Animation values
  const cardRotate = useRef(new Animated.Value(0)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const phoneGlow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!animated) return;

    // Card flip and move animation
    const cardAnimation = Animated.loop(
      Animated.sequence([
        // Start: card visible, slight pause
        Animated.delay(500),
        // Flip and move toward phone
        Animated.parallel([
          Animated.timing(cardRotate, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardTranslateX, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Phone glows when card enters
        Animated.timing(phoneGlow, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Hold
        Animated.delay(800),
        // Reset phone glow
        Animated.timing(phoneGlow, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        // Reset card position
        Animated.parallel([
          Animated.timing(cardRotate, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardTranslateX, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(500),
      ])
    );

    cardAnimation.start();

    return () => {
      cardAnimation.stop();
    };
  }, [animated]);

  const rotateInterpolate = cardRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const translateXInterpolate = cardTranslateX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 35],
  });

  return (
    <View style={styles.container}>
      {/* Logo animation: card goes into phone */}
      <View style={[styles.logoMark, { transform: [{ scale }] }]}>
        {/* Business Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: translateXInterpolate },
                { rotateY: rotateInterpolate },
                { scale: cardScale },
              ],
            },
          ]}
        >
          <View style={styles.cardLine} />
          <View style={styles.cardLineShort} />
          <View style={styles.cardLineShort} />
        </Animated.View>

        {/* Phone */}
        <Animated.View style={[styles.phone, { opacity: phoneGlow }]}>
          <Icon name="smartphone" size={36} color={TEXT_COLOR} />
        </Animated.View>
      </View>

      {/* Text */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.logoText, { fontSize: 32 * scale }]}>
            reachr
          </Text>
        </View>
      )}
    </View>
  );
}

const TEXT_COLOR = '#E5E5E5';
const CARD_COLOR = '#D1D5DB';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoMark: {
    width: 120,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  card: {
    width: 40,
    height: 28,
    backgroundColor: CARD_COLOR,
    borderRadius: 4,
    padding: 6,
    justifyContent: 'space-between',
    marginRight: 8,
  },
  cardLine: {
    width: '70%',
    height: 3,
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
  },
  cardLineShort: {
    width: '50%',
    height: 2,
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
  },
  phone: {
    marginLeft: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontWeight: '200',
    letterSpacing: 6,
    textTransform: 'lowercase',
    color: TEXT_COLOR,
  },
});
