import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../supabase';

WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogle = async () => {
  try {
    const redirectTo = AuthSession.makeRedirectUri({
      scheme: 'snaglog',
      path: 'auth',
    });
    console.log('🔗 Redirect URI:', redirectTo);

    // 1️⃣ Generate the Supabase OAuth URL (Supabase handles PKCE internally)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('🚨 signInWithOAuth error:', error.message);
      return false;
    }
    if (!data?.url) {
      console.warn('⚠️ No OAuth URL from Supabase.');
      return false;
    }

    console.log('🌐 Opening browser for Google login:', data.url);
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    console.log('📦 Auth session result:', result);

    if (result.type !== 'success' || !result.url) {
      console.warn('⚠️ Google sign-in cancelled or failed.');
      return false;
    }

    // 2️⃣ Extract parameters from redirect
    const { params } = QueryParams.getQueryParams(result.url);
    const { access_token, refresh_token, code } = params || {};

    // ✅ If tokens are returned directly
    if (access_token && refresh_token) {
      console.log('🔐 Tokens returned — setting session…');
      const { error: setErr } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (setErr) {
        console.error('setSession error:', setErr.message);
        return false;
      }
      console.log('✅ Google sign-in complete via token redirect.');
      return true;
    }

    // ✅ If we only get a code, exchange it for a session
    if (code) {
      console.log('🔄 Exchanging authorization code for session…');
      const { data: exData, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) {
        console.error('exchangeCodeForSession error:', exErr.message);
        return false;
      }
      console.log('✅ Google sign-in complete via code exchange.');
      return !!exData?.session;
    }

    console.warn('⚠️ Neither tokens nor code found in redirect.');
    return false;
  } catch (err) {
    console.error('🔥 Google OAuth exception:', err);
    return false;
  }
};
