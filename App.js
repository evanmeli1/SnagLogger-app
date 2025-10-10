// App.js
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext } from "react";
import { View, ActivityIndicator, Text } from 'react-native';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';

// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import SignUpScreen from './screens/SignUpScreen';
import SignInScreen from './screens/SignInScreen';
import LogAnnoyanceScreen from './screens/LogAnnoyanceScreen';
import CategorySelectionScreen from './screens/CategorySelectionScreen';
import AllSnags from './screens/AllSnags';
import MainTabs from './screens/MainTabs';
import EditEntriesScreen from './screens/EditEntriesScreen';
import SettingsScreen from './screens/SettingsScreen';
import ManageCategoriesScreen from './screens/ManageCategoriesScreen';
import ContactSupportScreen from './screens/ContactSupportScreen';
import ThemeScreen from './screens/ThemeScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import HelpScreen from './screens/HelpScreen';

// Import providers
import { ThemeProvider } from './utils/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { DataProvider, DataContext } from './context/DataContext';

const apiKey = Constants.expoConfig?.extra?.revenuecatKey;
if (apiKey) {
  Purchases.configure({ apiKey });
}

export const navigationRef = createNavigationContainerRef();
const Stack = createStackNavigator();

function RootNavigator() {
  const { session, authReady } = useContext(AuthContext);
  const { dataReady } = useContext(DataContext);

  if (!authReady || !dataReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6A0DAD" />
        <Text style={{ marginTop: 10 }}>Loading your account...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={session?.user ? "MainTabs" : "Welcome"}
        screenOptions={{ headerShown: false }}
      >
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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <RootNavigator />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}