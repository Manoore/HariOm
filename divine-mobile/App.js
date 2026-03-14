import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';

import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import DevoteeDashboard from './src/screens/DevoteeDashboard';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show loading while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.spinner} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is logged in - show dashboard based on role
          <>
            {user.role === 'admin' ? (
              <Stack.Screen name="AdminDashboard" component={DevoteeDashboard} />
            ) : user.role === 'priest' ? (
              <Stack.Screen name="PriestDashboard" component={DevoteeDashboard} />
            ) : user.role === 'shop_owner' ? (
              <Stack.Screen name="ShopOwnerDashboard" component={DevoteeDashboard} />
            ) : (
              <Stack.Screen name="DevoteeDashboard" component={DevoteeDashboard} />
            )}
          </>
        ) : (
          // User is not logged in - show auth flow
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFEDD5',
    borderTopColor: '#FF9933',
  },
});
