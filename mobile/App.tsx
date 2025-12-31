import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from './src/context/AuthContext';
import { LoginModalProvider } from './src/context/LoginModalContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/styles/colors';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LoginModalProvider>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={colors.canvas}
            />
            <AppNavigator />
          </LoginModalProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
