import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
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

interface TabIconProps {
  focused: boolean;
  iconName: string;
  label: string;
}

function TabIcon({ focused, iconName, label }: TabIconProps) {
  return (
    <View style={styles.tabContainer}>
      <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Icon
          name={iconName}
          size={22}
          color={focused ? colors.accent : colors.smoke}
        />
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

function TabBarBackground() {
  return (
    <View style={styles.tabBarBackground}>
      <View style={styles.tabBarHairline} />
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
            shadowOpacity: 0,
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
    backgroundColor: colors.canvas,
  },
  tabBarHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.misty,
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: colors.muted,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.smoke,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
});
