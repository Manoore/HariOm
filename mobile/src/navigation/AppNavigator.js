import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import StoreScreen from '../screens/StoreScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AstrologyScreen from '../screens/AstrologyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Bar Icon Component
const TabIcon = ({ name, focused }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
    <Ionicons 
      name={focused ? name : `${name}-outline`} 
      size={24} 
      color={focused ? COLORS.saffron : COLORS.gray[400]} 
    />
    {focused && <View style={styles.tabIndicator} />}
  </View>
);

// Main Tab Navigator (for logged in users)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: COLORS.saffron,
        tabBarInactiveTintColor: COLORS.gray[400],
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Store" 
        component={StoreScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="storefront" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Astrology" 
        component={AstrologyScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="planet" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Authenticated Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="Cart" 
              component={CartScreen}
              options={{ 
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="ProductDetail" 
              component={ProductDetailPlaceholder}
              options={{ 
                animation: 'slide_from_bottom',
                presentation: 'modal'
              }}
            />
            <Stack.Screen 
              name="Checkout" 
              component={CheckoutPlaceholder}
              options={{ 
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="PriestDetail" 
              component={PriestDetailPlaceholder}
              options={{ 
                animation: 'slide_from_bottom',
                presentation: 'modal'
              }}
            />
          </>
        ) : (
          // Auth Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Placeholder screens (to be implemented)
const ProductDetailPlaceholder = () => (
  <View style={styles.placeholder}>
    <Ionicons name="cube-outline" size={64} color={COLORS.gray[300]} />
  </View>
);

const CheckoutPlaceholder = () => (
  <View style={styles.placeholder}>
    <Ionicons name="card-outline" size={64} color={COLORS.gray[300]} />
  </View>
);

const PriestDetailPlaceholder = () => (
  <View style={styles.placeholder}>
    <Ionicons name="person-outline" size={64} color={COLORS.gray[300]} />
  </View>
);

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainerActive: {},
  tabIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.saffron,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },
});

export default AppNavigator;
