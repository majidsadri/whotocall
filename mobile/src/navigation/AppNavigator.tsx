import React from 'react';
import { View, StyleSheet, Text, Linking } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

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

// Purple spectrum colors for each tab
const PURPLE_SPECTRUM = {
  add: {
    active: '#C4B5FD',      // Light lavender
    inactive: '#7C3AED',    // Purple
    bg: '#7C3AED',
    glow: '#A78BFA',
  },
  search: {
    active: '#A78BFA',      // Medium purple
    inactive: '#8B5CF6',    // Purple-500
    bg: '#8B5CF6',
    glow: '#8B5CF6',
  },
  me: {
    active: '#E9D5FF',      // Lightest purple
    inactive: '#9333EA',    // Deep purple
    bg: '#9333EA',
    glow: '#A855F7',
  },
};

interface TabIconProps {
  focused: boolean;
  iconName: string;
  label: string;
  spectrum: typeof PURPLE_SPECTRUM.add;
}

function TabIcon({ focused, iconName, label, spectrum }: TabIconProps) {
  return (
    <View style={styles.tabContainer}>
      <View
        style={[
          styles.iconContainer,
          focused
            ? [styles.iconContainerActive, { backgroundColor: spectrum.bg, shadowColor: spectrum.glow }]
            : styles.iconContainerInactive,
        ]}
      >
        <Icon
          name={iconName}
          size={24}
          color={focused ? '#FFFFFF' : spectrum.inactive}
        />
      </View>
      <Text
        style={[
          styles.label,
          focused
            ? [styles.labelActive, { color: spectrum.active, textShadowColor: spectrum.glow }]
            : [styles.labelInactive, { color: spectrum.inactive }]
        ]}
      >
        {label}
      </Text>
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
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 12,
            paddingBottom: 28,
            height: 90,
          },
        }}
      >
        <Tab.Screen
          name="Add"
          component={AddContactScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                iconName="user-plus"
                label="Add"
                spectrum={PURPLE_SPECTRUM.add}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={FindContactScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                iconName="search"
                label="Find"
                spectrum={PURPLE_SPECTRUM.search}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Me"
          component={MeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                iconName="user"
                label="Me"
                spectrum={PURPLE_SPECTRUM.me}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: 90,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainerInactive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelActive: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  labelInactive: {},
});
