import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import OwnerTabNavigator from './OwnerTabNavigator';


// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Owner screens
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';

// Driver screens
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverTabNavigator from './DriverTabNavigator';

// Student screens
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentJoinRequestScreen from '../screens/student/StudentJoinRequestScreen';
import StudentTabNavigator from './StudentTabNavigator';

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
          // Not logged in
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'owner' ? (
          // Owner screens
<Stack.Screen name="OwnerDashboard" component={OwnerTabNavigator} />
        ) : user.role === 'driver' ? (
  <Stack.Screen name="DriverHome" component={DriverTabNavigator} />
) : (
  <>
    <Stack.Screen name="StudentHome" component={StudentTabNavigator} />
    <Stack.Screen name="JoinRequest" component={StudentJoinRequestScreen} />
  </>
)}
      </Stack.Navigator>
    </NavigationContainer>
  );
}