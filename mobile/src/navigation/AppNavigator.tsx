import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
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
  if (focused) {
    return (
      <View style={styles.activeTabContainer}>
        <View style={styles.activeIconContainer}>
          <Icon name={iconName} size={22} color={colors.white} />
        </View>
        <Text style={styles.activeLabel}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.inactiveTabContainer}>
      <View style={styles.inactiveIconContainer}>
        <Icon name={iconName} size={22} color={colors.gray[400]} />
      </View>
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
  },
  activeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyan[400],
    letterSpacing: 0.5,
  },
  inactiveTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  inactiveIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inactiveLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[500],
    letterSpacing: 0.3,
  },
});
