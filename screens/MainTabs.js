// screens/MainTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './HomeScreen';
import CalendarScreen from './CalendarScreen';
import AnalyticsScreen from './AnalyticsScreen';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          borderRadius: 30,
          marginHorizontal: 20,
          marginBottom: 20,
          paddingHorizontal: 10,
          paddingTop: 10,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return (
            <View style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>
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