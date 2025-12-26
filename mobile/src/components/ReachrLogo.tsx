import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface ReachrLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'default' | 'cyan';
  animated?: boolean;
}

export default function ReachrLogo({ size = 'medium', showText = true, variant = 'default', animated = true }: ReachrLogoProps) {
  const scale = size === 'small' ? 0.7 : size === 'large' ? 1.5 : 1;
  const isCyan = variant === 'cyan';
  const mainColor = isCyan ? CYAN : PURPLE;
  const lightColor = isCyan ? CYAN_LIGHT : PURPLE_LIGHT;

  // Animation values for each circle
  const circle1Anim = useRef(new Animated.Value(1)).current;
  const circle2Anim = useRef(new Animated.Value(1)).current;
  const circle3Anim = useRef(new Animated.Value(1)).current;
  const circle4Anim = useRef(new Animated.Value(1)).current;
  const circle5Anim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const underlineAnim = useRef(new Animated.Value(0)).current;
  const textShineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    // Staggered wave animation for circles
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.3,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(1800 - delay),
        ])
      );
    };

    // Glow pulse for the big circle
    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Underline shimmer animation
    const underlineShimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(underlineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(underlineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Text shine animation
    const textShine = Animated.loop(
      Animated.sequence([
        Animated.timing(textShineAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textShineAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const pulse1 = createPulse(circle1Anim, 0);
    const pulse2 = createPulse(circle2Anim, 150);
    const pulse3 = createPulse(circle3Anim, 300);
    const pulse4 = createPulse(circle4Anim, 450);
    const pulse5 = createPulse(circle5Anim, 600);

    pulse1.start();
    pulse2.start();
    pulse3.start();
    pulse4.start();
    pulse5.start();
    glowPulse.start();
    underlineShimmer.start();
    textShine.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
      pulse3.stop();
      pulse4.stop();
      pulse5.stop();
      glowPulse.stop();
      underlineShimmer.stop();
      textShine.stop();
    };
  }, [animated]);

  return (
    <View style={styles.container}>
      {/* Circles in a straight horizontal line */}
      <View style={[styles.logoMark, { transform: [{ scale }] }]}>
        {/* Tiny dot */}
        <Animated.View
          style={[
            styles.circle,
            styles.circle1,
            { backgroundColor: mainColor, transform: [{ scale: circle1Anim }] }
          ]}
        />
        {/* Small dot */}
        <Animated.View
          style={[
            styles.circle,
            styles.circle2,
            { backgroundColor: mainColor, transform: [{ scale: circle2Anim }] }
          ]}
        />
        {/* Medium dot */}
        <Animated.View
          style={[
            styles.circle,
            styles.circle3,
            { backgroundColor: mainColor, transform: [{ scale: circle3Anim }] }
          ]}
        />
        {/* Larger dot */}
        <Animated.View
          style={[
            styles.circle,
            styles.circle4,
            { backgroundColor: mainColor, transform: [{ scale: circle4Anim }] }
          ]}
        />
        {/* Big ball with glow */}
        <View style={styles.bigCircleContainer}>
          <Animated.View
            style={[
              styles.circleGlow,
              {
                backgroundColor: lightColor,
                opacity: glowAnim,
                transform: [{ scale: circle5Anim }],
              }
            ]}
          />
          <Animated.View
            style={[
              styles.circle,
              styles.circle5,
              {
                backgroundColor: lightColor,
                shadowColor: mainColor,
                transform: [{ scale: circle5Anim }],
              }
            ]}
          />
        </View>
      </View>

      {/* Text */}
      {showText && (
        <View style={styles.textContainer}>
          <Animated.Text
            style={[
              styles.logoText,
              {
                fontSize: 32 * scale,
                color: lightColor,
                opacity: textShineAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.9, 1, 0.9],
                }),
              }
            ]}
          >
            reachr
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#A78BFA';
const CYAN = '#06B6D4';
const CYAN_LIGHT = '#22D3EE';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoMark: {
    width: 140,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  circle: {
    backgroundColor: PURPLE,
    borderRadius: 50,
    marginHorizontal: 3,
  },
  // Straight line - small to large
  circle1: {
    width: 6,
    height: 6,
    opacity: 0.4,
  },
  circle2: {
    width: 10,
    height: 10,
    opacity: 0.55,
  },
  circle3: {
    width: 14,
    height: 14,
    opacity: 0.7,
  },
  circle4: {
    width: 18,
    height: 18,
    opacity: 0.85,
  },
  bigCircleContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  circleGlow: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  circle5: {
    width: 28,
    height: 28,
    backgroundColor: PURPLE_LIGHT,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontWeight: '200',
    letterSpacing: 6,
    textTransform: 'lowercase',
  },
});
