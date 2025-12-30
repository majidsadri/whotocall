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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LoginModalProvider>
            <StatusBar
              barStyle="light-content"
              backgroundColor={colors.background}
            />
            <AppNavigator />
          </LoginModalProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
