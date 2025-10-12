import 'dotenv/config';

export default {
  expo: {
    name: "daily-annoyances",
    slug: "daily-annoyances",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "snaglog",  // ← ADD THIS LINE!
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: { 
      supportsTablet: true,
      bundleIdentifier: "com.evanmeli.snaglog",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      },
      //associatedDomains: ["applinks:eucnequonbufskidhqir.supabase.co"]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.anonymous.dailyannoyances"
    },
    web: { favicon: "./assets/favicon.png" },
    plugins: ["expo-mail-composer"],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      revenuecatKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
      eas: {
        projectId: "d5a5ede0-a061-4c83-9377-18c859ee7043"
      }
    },
  },
};