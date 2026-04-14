import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import OwnerBusesScreen from '../screens/owner/OwnerBusesScreen';
import OwnerStudentsScreen from '../screens/owner/OwnerStudentsScreen';
import OwnerTripsScreen from '../screens/owner/OwnerTripsScreen';

const Tab = createBottomTabNavigator();

export default function OwnerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E2E8F0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Buses') iconName = focused ? 'bus' : 'bus-outline';
          else if (route.name === 'Students') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Trips') iconName = focused ? 'map' : 'map-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen name="Buses" component={OwnerBusesScreen} />
      <Tab.Screen name="Students" component={OwnerStudentsScreen} />
      <Tab.Screen name="Trips" component={OwnerTripsScreen} />
    </Tab.Navigator>
  );
}