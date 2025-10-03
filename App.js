import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from "react";
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';

import WelcomeScreen from './screens/WelcomeScreen';
import SignUpScreen from './screens/SignUpScreen';
import SignInScreen from './screens/SignInScreen';
import LogAnnoyanceScreen from './screens/LogAnnoyanceScreen';
import CategorySelectionScreen from './screens/CategorySelectionScreen';
import AllSnags from './screens/AllSnags';
import MainTabs from './screens/MainTabs';
import EditEntriesScreen from './screens/EditEntriesScreen';
import SettingsScreen from './screens/SettingsScreen.js';
import ManageCategoriesScreen from './screens/ManageCategoriesScreen';
import ContactSupportScreen from './screens/ContactSupportScreen';
import * as Notifications from 'expo-notifications';
import ThemeScreen from './screens/ThemeScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import HelpScreen from './screens/HelpScreen';



Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    Purchases.configure({
      apiKey: Constants.expoConfig.extra.revenuecatKey,
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="LogAnnoyance" component={LogAnnoyanceScreen} />
        <Stack.Screen name="CategorySelection" component={CategorySelectionScreen} />
        <Stack.Screen name="AllSnags" component={AllSnags} />
        <Stack.Screen name="EditEntries" component={EditEntriesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ManageCategories" component={ManageCategoriesScreen} />
        <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
        <Stack.Screen name="ThemeScreen" component={ThemeScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}