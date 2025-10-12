// utils/appleAuth.js
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../supabase';
import { Platform } from 'react-native';

export const signInWithApple = async () => {
  try {
    // Check if Apple Authentication is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      console.log('Apple Sign In not available on this device');
      return false;
    }

    // Request Apple authentication
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('Apple credential:', credential);

    // Sign in to Supabase with the Apple ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      console.error('Supabase Apple sign in error:', error);
      return false;
    }

    console.log('Apple sign in successful:', data);
    return true;

  } catch (error) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      // User canceled the sign-in flow
      console.log('User canceled Apple sign in');
      return false;
    }
    console.error('Apple sign in error:', error);
    return false;
  }
};