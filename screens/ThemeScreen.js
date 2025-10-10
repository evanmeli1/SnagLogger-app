// screens/ThemeScreen.js - Beautiful Redesign
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { fetchProStatus } from '../utils/subscriptions';
import { useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../utils/ThemeContext';

export default function ThemeScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [isPro, setIsPro] = useState(false);
  const { theme, mode, setMode, accent, setAccent } = useContext(ThemeContext);

  useEffect(() => {
    const loadProStatus = async () => {
      const status = await fetchProStatus();
      setIsPro(status.isPro);
    };
    
    if (isFocused) {
      loadProStatus();
    }
  }, [isFocused]);

  const accentOptions = [
    { key: 'lavender', name: 'Lavender', gradient: ['#6A0DAD', '#8B5CF6'], emoji: '💜' },
    { key: 'ocean', name: 'Ocean', gradient: ['#0077BE', '#4A9FD8'], emoji: '🌊' },
    { key: 'forest', name: 'Forest', gradient: ['#2E7D32', '#4CAF50'], emoji: '🌲' },
    { key: 'sunset', name: 'Sunset', gradient: ['#FF6B6B', '#FF8E8E'], emoji: '🌅' },
    { key: 'rose', name: 'Rose', gradient: ['#C2185B', '#E91E63'], emoji: '🌹' },
  ];

  const handleAccentSelect = (accentKey) => {
    if (!isPro && accentKey !== 'lavender') {
      Alert.alert(
        "💎 Pro Feature",
        "Custom accent colors are available with Pro. Upgrade to unlock all color themes!",
        [
          { text: "Upgrade to Pro", onPress: () => navigation.navigate("Settings") }, 
          { text: "Maybe Later", style: "cancel" }
        ]
      );
      return;
    }
    setAccent(accentKey);
  };

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Customize Theme</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Current Theme Preview Card */}
        <View style={[styles.previewCard, { backgroundColor: theme.surface }]}>
          <LinearGradient
            colors={theme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewGradient}
          >
            <View style={styles.previewContent}>
              <Text style={styles.previewEmoji}>
                {mode === 'light' ? '☀️' : '🌙'}
              </Text>
              <Text style={[styles.previewTitle, { color: theme.text }]}>
                {mode === 'light' ? 'Light' : 'Dark'} Mode
              </Text>
              <View style={[styles.accentDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.previewSubtitle, { color: theme.textSecondary }]}>
                {accentOptions.find(a => a.key === accent)?.name} Theme
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Theme Mode Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Brightness
          </Text>
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[
                styles.modeCard,
                { backgroundColor: theme.surface },
                mode === "light" && { 
                  borderWidth: 3, 
                  borderColor: theme.accent,
                  transform: [{ scale: 1.05 }]
                }
              ]}
              onPress={() => setMode("light")}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={mode === 'light' ? [theme.accent, theme.accentLight] : ['transparent', 'transparent']}
                style={styles.modeGradient}
              >
                <Ionicons
                  name="sunny"
                  size={32}
                  color={mode === "light" ? "#FFF" : theme.accent}
                />
                <Text style={[
                  styles.modeText,
                  { color: mode === "light" ? "#FFF" : theme.text }
                ]}>
                  Light
                </Text>
                {mode === "light" && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                { backgroundColor: theme.surface },
                mode === "dark" && { 
                  borderWidth: 3, 
                  borderColor: theme.accent,
                  transform: [{ scale: 1.05 }]
                }
              ]}
              onPress={() => setMode("dark")}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={mode === 'dark' ? [theme.accent, theme.accentLight] : ['transparent', 'transparent']}
                style={styles.modeGradient}
              >
                <Ionicons
                  name="moon"
                  size={32}
                  color={mode === "dark" ? "#FFF" : theme.accent}
                />
                <Text style={[
                  styles.modeText,
                  { color: mode === "dark" ? "#FFF" : theme.text }
                ]}>
                  Dark
                </Text>
                {mode === "dark" && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Accent Colors Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Accent Colors
            </Text>
            {!isPro && (
              <View style={[styles.proBadge, { backgroundColor: theme.accent }]}>
                <Ionicons name="star" size={12} color="#FFF" />
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
          </View>

          <View style={styles.accentGrid}>
            {accentOptions.map((option) => {
              const isSelected = accent === option.key;
              const isLocked = !isPro && option.key !== 'lavender';
              
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.accentCard,
                    { backgroundColor: theme.surface },
                    isSelected && { 
                      borderWidth: 3, 
                      borderColor: theme.accent,
                      transform: [{ scale: 1.05 }]
                    }
                  ]}
                  onPress={() => handleAccentSelect(option.key)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={option.gradient}
                    style={styles.accentGradient}
                  >
                    <Text style={styles.accentEmoji}>{option.emoji}</Text>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      </View>
                    )}
                    {isLocked && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={20} color="#FFF" />
                      </View>
                    )}
                  </LinearGradient>
                  <Text style={[
                    styles.accentName,
                    { color: isSelected ? theme.accent : theme.textSecondary },
                    isSelected && { fontWeight: '700' }
                  ]}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pro Prompt */}
        {!isPro && (
          <TouchableOpacity
            style={[styles.proPrompt, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate("Settings")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.accent, theme.accentLight]}
              style={styles.proPromptGradient}
            >
              <View style={styles.proPromptContent}>
                <Ionicons name="sparkles" size={28} color="#FFF" />
                <View style={styles.proPromptText}>
                  <Text style={styles.proPromptTitle}>Unlock All Colors</Text>
                  <Text style={styles.proPromptSubtitle}>
                    Get access to all accent themes with Pro
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Tips */}
        <View style={[styles.tipsCard, { backgroundColor: theme.surface }]}>
          <View style={styles.tipRow}>
            <Ionicons name="bulb-outline" size={20} color={theme.accent} />
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Your theme syncs across all screens automatically
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  // Preview Card
  previewCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 4,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  previewGradient: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  previewContent: {
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  accentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  previewSubtitle: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Section
  section: { 
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  proText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },

  // Mode Cards
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modeGradient: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  modeText: { 
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Accent Grid
  accentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  accentCard: {
    width: '31%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  accentGradient: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  accentEmoji: {
    fontSize: 32,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accentName: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 12,
  },

  // Pro Prompt
  proPrompt: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  proPromptGradient: {
    padding: 20,
  },
  proPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  proPromptText: {
    flex: 1,
  },
  proPromptTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  proPromptSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Tips
  tipsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});