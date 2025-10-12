// screens/HelpScreen.js
import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../utils/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HelpScreen({ navigation }) {
  const { theme, mode } = useContext(ThemeContext);
  const [expandedSection, setExpandedSection] = useState(null);

  const blob1Float = useRef(new Animated.Value(0)).current;
  const blob2Float = useRef(new Animated.Value(0)).current;
  const blob3Float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createFloatingAnimation = (animValue, duration) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration, useNativeDriver: true }),
        ])
      );
    };

    createFloatingAnimation(blob1Float, 4600).start();
    createFloatingAnimation(blob2Float, 5100).start();
    createFloatingAnimation(blob3Float, 4300).start();
  }, []);

  const toggleSection = (section) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === section ? null : section);
  };

  const helpSections = [
    {
      id: 1,
      title: 'Getting Started',
      content: `Create an account or use guest mode to start logging annoyances.\n\nGuest data stays on your device. Create an account to sync across devices and unlock Pro features.`,
    },
    {
      id: 2,
      title: 'Logging Annoyances',
      content: `Tap the + button to log a new snag.\n\n1. Describe what annoyed you\n2. Rate the intensity (1-10)\n3. Pick a category\n4. Save\n\nYour entry will appear in your calendar and analytics.`,
    },
    {
      id: 3,
      title: 'Editing & Deleting',
      content: `You can edit entries for 72 hours after creation.\n\nAfter 72 hours, entries lock permanently to maintain data integrity.\n\nTo delete: Open the entry → tap Delete → confirm.`,
    },
    {
      id: 4,
      title: 'Categories',
      content: `Use default categories or create your own.\n\nTo manage categories:\nSettings → Manage Categories\n\nFree: 1 custom category\nPro: Up to 20 custom categories\n\nCustomize with emoji and colors.`,
    },
    {
      id: 5,
      title: 'Calendar View',
      content: `Colors show your day's mood:\n\nGreen: 1-3 annoyances (good day)\nYellow: 4-6 annoyances (rough day)\nRed: 7+ annoyances (tough day)\nGray: No entries\n\nTap any day to see details.`,
    },
    {
      id: 6,
      title: 'Analytics (Pro)',
      content: `Pro users get:\n\n- Streak tracking\n- Top triggers\n- AI-powered insights\n- Weekly/monthly trends\n- Personalized tips\n\nUpgrade in Settings to unlock.`,
    },
    {
      id: 7,
      title: 'Export Your Data (Pro)',
      content: `Pro users can export all data as CSV.\n\nSettings → Export Data\n\nChoose email or save to device.\n\nYour export includes dates, categories, descriptions, and ratings.`,
    },
    {
      id: 8,
      title: 'Guest to Account Sync',
      content: `Using guest mode? Your data syncs when you create an account.\n\nSign Up → All guest data transfers automatically.\n\nYour local data moves to the cloud for cross-device access.`,
    },
    {
      id: 9,
      title: 'Clearing Data',
      content: `To clear all data:\nSettings → Clear All Data\n\nThis deletes:\n- All annoyance logs\n- Custom categories\n\nYour account stays active.`,
    },
    {
      id: 10,
      title: 'Notifications',
      content: `Enable daily reminders to log consistently.\n\nSettings → Notifications toggle\n\nNotifications help build the habit of tracking patterns.`,
    },
  ];

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      {/* Floating blobs */}
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          { backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})` },
          {
            transform: [
              {
                translateY: blob1Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -28],
                }),
              },
              { rotate: '10deg' },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          { backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})` },
          {
            transform: [
              {
                translateY: blob2Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 23],
                }),
              },
              { rotate: '-16deg' },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob3,
          { backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})` },
          {
            transform: [
              {
                translateY: blob3Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
              { rotate: '24deg' },
            ],
          },
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: theme.text }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Help</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={[styles.introCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.introTitle, { color: theme.text }]}>How can we help?</Text>
          <Text style={[styles.introText, { color: theme.textSecondary }]}>
            Find answers to common questions below. Tap any section to expand.
          </Text>
        </View>

        {/* Collapsible Sections */}
        {helpSections.map((section) => (
          <View key={section.id} style={[styles.accordionItem, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection(section.id)}>
              <Text style={[styles.accordionTitle, { color: theme.text }]}>{section.title}</Text>
              <Text style={[styles.accordionIcon, { color: theme.textSecondary }]}>
                {expandedSection === section.id ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            {expandedSection === section.id && (
              <Animated.View style={styles.accordionContent}>
                <Text style={[styles.accordionText, { color: theme.textSecondary }]}>{section.content}</Text>
              </Animated.View>
            )}
          </View>
        ))}

        {/* Contact Card */}
        <View style={[styles.contactCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.contactTitle, { color: theme.text }]}>Still Need Help?</Text>
          <Text style={[styles.contactText, { color: theme.textSecondary }]}>
            Can't find what you're looking for? Contact our support team.
          </Text>
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate('ContactSupport')}
          >
            <Text style={[styles.contactBtnText, { color: '#FFF' }]}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blob: {
    position: 'absolute',
    borderRadius: 100,
  },
  blob1: { width: 135, height: 225, top: 90, left: -42 },
  blob2: { width: 105, height: 185, top: 380, right: -32 },
  blob3: { width: 92, height: 155, bottom: 180, left: 22 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  introCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  introTitle: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  introText: { fontSize: 15, lineHeight: 22 },
  accordionItem: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  accordionTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  accordionIcon: { fontSize: 24, fontWeight: '300', marginLeft: 12 },
  accordionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  accordionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  contactCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    marginTop: 12,
  },
  contactTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  contactText: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  contactBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  contactBtnText: { fontSize: 15, fontWeight: '700' },
});
