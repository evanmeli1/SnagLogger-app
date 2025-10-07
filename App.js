import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from 'react-native';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

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
import ThemeScreen from './screens/ThemeScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import HelpScreen from './screens/HelpScreen';

import { supabase } from './supabase';
import { initializeRevenueCat, syncSubscriptionStatus } from './utils/subscriptions';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Welcome');

  useEffect(() => {
    const initApp = async () => {
      try {
        // Configure RevenueCat
        const apiKey = Constants.expoConfig?.extra?.revenuecatKey;
        console.log("Attempting to configure RevenueCat with key:", apiKey);
        
        if (!apiKey) {
          console.error("API KEY IS UNDEFINED OR NULL");
        } else {
          await Purchases.configure({ apiKey });
          console.log("RevenueCat configured successfully");
        }

        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("User already logged in, going to MainTabs");
          setInitialRoute('MainTabs');
          await initializeRevenueCat(session.user.id);
          await syncSubscriptionStatus();
        } else {
          console.log("No session found, going to Welcome");
          setInitialRoute('Welcome');
        }
      } catch (error) {
        console.error("Error initializing app:", error);
        setInitialRoute('Welcome');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();

    // Auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await initializeRevenueCat(session.user.id);
          await syncSubscriptionStatus();
        } else if (event === "SIGNED_OUT") {
          try {
            await Purchases.logOut();
          } catch (error) {
            console.log("RevenueCat logout error:", error);
          }
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6A0DAD" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
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