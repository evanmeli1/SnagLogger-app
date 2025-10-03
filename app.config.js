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
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: { supportsTablet: true },
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
    },
  },
};
