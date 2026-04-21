import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DriverTripsScreen from '../screens/driver/DriverTripsScreen';
import DriverPaymentsScreen from '../screens/driver/DriverPaymentsScreen';
const Tab = createBottomTabNavigator();

export default function DriverTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E2E8F0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'Trips') iconName = focused ? 'bus' : 'bus-outline';
          else iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Trips"
        component={DriverTripsScreen}
        options={{ tabBarLabel: 'My Trips' }}
      />
    <Tab.Screen
  name="History"
  component={DriverPaymentsScreen}
  options={{
    tabBarLabel: 'Payments',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons
        name={focused ? 'wallet' : 'wallet-outline'}
        size={size}
        color={color}
      />
    ),
  }}
/>
    </Tab.Navigator>
  );
}