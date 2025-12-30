import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Platform } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

import AddContactScreen from '../screens/AddContactScreen';
import FindContactScreen from '../screens/FindContactScreen';
import MeScreen from '../screens/MeScreen';
import { colors } from '../styles/colors';

export type RootTabParamList = {
  Add: {
    name?: string;
    email?: string;
    phone?: string;
    title?: string;
    company?: string;
    linkedin?: string;
  } | undefined;
  Search: undefined;
  Me: undefined;
};

// Deep linking configuration
const linking: LinkingOptions<RootTabParamList> = {
  prefixes: ['reachr://'],
  config: {
    screens: {
      Add: {
        path: 'add-contact',
        parse: {
          name: (v: string) => decodeURIComponent(v || ''),
          email: (v: string) => decodeURIComponent(v || ''),
          phone: (v: string) => decodeURIComponent(v || ''),
          title: (v: string) => decodeURIComponent(v || ''),
          company: (v: string) => decodeURIComponent(v || ''),
          linkedin: (v: string) => decodeURIComponent(v || ''),
        },
      },
    },
  },
};

const Tab = createBottomTabNavigator<RootTabParamList>();

interface TabIconProps {
  focused: boolean;
  iconName: string;
  label: string;
}

function TabIcon({ focused, iconName, label }: TabIconProps) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1 : 0.9,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={[
        styles.tabContainer,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
      ]}
    >
      {focused ? (
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainerActive}
        >
          <Icon name={iconName} size={22} color="#FFFFFF" />
        </LinearGradient>
      ) : (
        <View style={styles.iconContainerInactive}>
          <Icon name={iconName} size={22} color="#9CA3AF" />
        </View>
      )}
      <Text style={[styles.label, focused && styles.labelActive]}>
        {label}
      </Text>
    </Animated.View>
  );
}

function TabBarBackground() {
  return (
    <View style={styles.tabBarBackground}>
      <LinearGradient
        colors={['rgba(15, 15, 19, 0.95)', 'rgba(20, 20, 28, 0.98)']}
        style={styles.tabBarGradient}
      />
      <View style={styles.tabBarGlow} />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: Platform.OS === 'ios' ? 88 : 70,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () => <TabBarBackground />,
        }}
      >
        <Tab.Screen
          name="Add"
          component={AddContactScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconName="plus-circle" label="Add" />
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
        <Tab.Screen
          name="Me"
          component={MeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconName="user" label="Me" />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  tabBarGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBarGlow: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  iconContainerActive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainerInactive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#C4B5FD',
    fontWeight: '600',
  },
});
