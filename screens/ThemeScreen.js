// screens/ThemeScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function ThemeScreen({ navigation }) {
  const [isPro, setIsPro] = useState(false);
    useEffect(() => {
    const loadPro = async () => {
        const stored = await AsyncStorage.getItem("isPro");
        if (stored === "true") setIsPro(true);
    };
    loadPro();
    }, []);

  const [mode, setMode] = useState("light"); // "light" | "dark"
  const [accent, setAccent] = useState("#6A0DAD");

  // Load saved theme
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem("app_theme");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.mode) setMode(parsed.mode);
          if (parsed.accent) setAccent(parsed.accent);
        }
      } catch (err) {
        console.log("Error loading theme:", err);
      }
    };
    loadTheme();
  }, []);

  // Save theme
  const saveTheme = async (newMode, newAccent) => {
    const theme = { mode: newMode || mode, accent: newAccent || accent };
    setMode(theme.mode);
    setAccent(theme.accent);
    await AsyncStorage.setItem("app_theme", JSON.stringify(theme));
  };

  // Available accent colors
  const accentColors = [
    "#6A0DAD", // Purple
    "#007AFF", // Blue
    "#34C759", // Green
    "#FF9500", // Orange
    "#FF2D55", // Pink
    "#FFD60A", // Yellow
  ];

  // Handle accent tap
  const handleAccentSelect = (color) => {
    if (!isPro) {
      Alert.alert(
        "Pro Required",
        "Custom colors are a Pro feature. Upgrade to unlock!",
        [{ text: "Upgrade", onPress: () => navigation.navigate("Settings") }, { text: "Cancel" }]
      );
      return;
    }
    saveTheme(null, color);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Theme Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Mode Section */}
        <Text style={styles.sectionTitle}>Theme Mode</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "light" && styles.modeActive]}
            onPress={() => saveTheme("light", null)}
          >
            <Ionicons
              name="sunny"
              size={20}
              color={mode === "light" ? "#fff" : "#666"}
            />
            <Text
              style={[
                styles.modeText,
                { color: mode === "light" ? "#fff" : "#333" },
              ]}
            >
              Light
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === "dark" && styles.modeActive]}
            onPress={() => saveTheme("dark", null)}
          >
            <Ionicons
              name="moon"
              size={20}
              color={mode === "dark" ? "#fff" : "#666"}
            />
            <Text
              style={[
                styles.modeText,
                { color: mode === "dark" ? "#fff" : "#333" },
              ]}
            >
              Dark
            </Text>
          </TouchableOpacity>
        </View>

        {/* Accent Section */}
        <Text style={styles.sectionTitle}>Accent Colors</Text>
        <View style={styles.swatchGrid}>
          {accentColors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.swatch,
                { backgroundColor: color },
                accent === color && styles.swatchActive,
              ]}
              onPress={() => handleAccentSelect(color)}
            >
              {accent === color && (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
              {!isPro && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Theme Display */}
        <Text style={styles.previewLabel}>Current Theme:</Text>
        <View
          style={[
            styles.previewBox,
            { backgroundColor: mode === "light" ? "#F9F9F9" : "#121212" },
          ]}
        >
          <Text style={{ color: accent, fontWeight: "700" }}>
            {mode.toUpperCase()} MODE with accent {accent}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  backBtn: { fontSize: 16, color: "#6A0DAD", fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#333" },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  optionRow: { flexDirection: "row", justifyContent: "center", marginBottom: 16 },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    backgroundColor: "#fff",
  },
  modeActive: { backgroundColor: "#6A0DAD", borderColor: "#6A0DAD" },
  modeText: { marginLeft: 8, fontSize: 16 },

  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  swatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  swatchActive: { borderWidth: 2, borderColor: "#333" },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  previewLabel: {
    textAlign: "center",
    marginTop: 20,
    fontWeight: "600",
    color: "#333",
  },
  previewBox: {
    marginTop: 10,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});
