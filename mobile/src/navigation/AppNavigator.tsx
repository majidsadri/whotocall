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
  return (
    <View style={styles.tabContainer}>
      <View
        style={[
          styles.iconContainer,
          focused ? styles.iconContainerActive : styles.iconContainerInactive,
        ]}
      >
        <Icon
          name={iconName}
          size={24}
          color={focused ? colors.white : colors.gray[400]}
        />
      </View>
      <Text style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
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
    backgroundColor: colors.purple[600],
    shadowColor: colors.purple[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainerInactive: {
    backgroundColor: colors.gray[800],
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.purple[400],
    textShadowColor: colors.purple[500],
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  labelInactive: {
    color: colors.gray[500],
  },
});
