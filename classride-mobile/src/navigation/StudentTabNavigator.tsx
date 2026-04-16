import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentDailyScreen from '../screens/student/StudentDailyScreen';
import StudentScheduleScreen from '../screens/student/StudentScheduleScreen';

const Tab = createBottomTabNavigator();

export default function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#059669',
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
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Attendance') iconName = focused ? 'calendar' : 'calendar-outline';
          else iconName = focused ? 'time' : 'time-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={StudentHomeScreen}
        options={{ tabBarLabel: 'My Trips' }}
      />
      <Tab.Screen
  name="Attendance"
  component={StudentDailyScreen}
  options={{ tabBarLabel: 'Daily' }}
/>
      <Tab.Screen
        name="Schedule"
        component={StudentScheduleScreen}
        options={{ tabBarLabel: 'Weekly' }}
      />
    </Tab.Navigator>
  );
}