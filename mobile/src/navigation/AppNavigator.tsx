import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

import AddContactScreen from '../screens/AddContactScreen';
import FindContactScreen from '../screens/FindContactScreen';
import { colors } from '../styles/colors';

export type RootTabParamList = {
  Add: undefined;
  Search: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

interface TabIconProps {
  focused: boolean;
  iconName: string;
  label: string;
}

function TabIcon({ focused, iconName, label }: TabIconProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;

  useEffect(() => {
    if (focused) {
      // Scale up animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Continuous pulse animation for the glow ring
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      // Glow opacity animation
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      pulseLoop.start();
      glowLoop.start();

      return () => {
        pulseLoop.stop();
        glowLoop.stop();
      };
    } else {
      // Scale down for inactive
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [focused]);

  if (focused) {
    return (
      <View style={styles.activeTabContainer}>
        {/* Outer pulsing glow ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: glowAnim,
            },
          ]}
        />
        {/* Inner glow ring */}
        <Animated.View
          style={[
            styles.innerGlowRing,
            {
              opacity: glowAnim,
            },
          ]}
        />
        {/* Main icon container */}
        <Animated.View
          style={[
            styles.activeIconContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Icon name={iconName} size={24} color={colors.white} />
        </Animated.View>
        <Text style={styles.activeLabel}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.inactiveTabContainer}>
      <Animated.View
        style={[
          styles.inactiveIconContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Icon name={iconName} size={22} color={colors.gray[400]} />
      </Animated.View>
      <Text style={styles.inactiveLabel}>{label}</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 8,
            paddingBottom: 24,
            height: 80,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 12,
          },
        }}
      >
        <Tab.Screen
          name="Add"
          component={AddContactScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconName="user-plus" label="Add" />
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={FindContactScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconName="search" label="Find" />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  activeTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: 80,
    height: 70,
  },
  glowRing: {
    position: 'absolute',
    top: 0,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    shadowColor: colors.cyan[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  innerGlowRing: {
    position: 'absolute',
    top: 4,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purple[500],
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  activeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.cyan[400],
    shadowColor: colors.cyan[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 10,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyan[400],
    letterSpacing: 0.5,
    textShadowColor: colors.cyan[400],
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginTop: 2,
  },
  inactiveTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: 80,
    height: 70,
  },
  inactiveIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inactiveLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[500],
    letterSpacing: 0.3,
  },
});
