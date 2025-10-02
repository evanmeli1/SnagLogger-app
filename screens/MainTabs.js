// screens/MainTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './HomeScreen';
import CalendarScreen from './CalendarScreen';  // you’ll need to create this
import AnalyticsScreen from './AnalyticsScreen'; // you’ll need to create this
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused }) => {
          let icon = '⬜';

          if (route.name === 'Home') icon = '🏠';
          if (route.name === 'Calendar') icon = '📅';
          if (route.name === 'Analytics') icon = '📊';

          return (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
              {icon}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}
