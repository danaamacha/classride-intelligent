import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

import OwnerTabNavigator from './OwnerTabNavigator';
import DriverTabNavigator from './DriverTabNavigator';
import StudentTabNavigator from './StudentTabNavigator';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import StudentJoinRequestScreen from '../screens/student/StudentJoinRequestScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'owner' ? (
          <>
            <Stack.Screen name="OwnerDashboard" component={OwnerTabNavigator} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        ) : user.role === 'driver' ? (
          <>
            <Stack.Screen name="DriverHome" component={DriverTabNavigator} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="StudentHome" component={StudentTabNavigator} />
            <Stack.Screen name="JoinRequest" component={StudentJoinRequestScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}