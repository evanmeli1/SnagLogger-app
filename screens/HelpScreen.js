// screens/HelpScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HelpScreen({ navigation }) {
  const [expandedSection, setExpandedSection] = useState(null);

  // Floating blob animations
  const blob1Float = useRef(new Animated.Value(0)).current;
  const blob2Float = useRef(new Animated.Value(0)).current;
  const blob3Float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createFloatingAnimation = (animValue, duration) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatingAnimation(blob1Float, 4600).start();
    createFloatingAnimation(blob2Float, 5100).start();
    createFloatingAnimation(blob3Float, 4300).start();
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const helpSections = [
    {
      id: 1,
      title: 'Getting Started',
      content: `Create an account or use guest mode to start logging annoyances.

Guest data stays on your device. Create an account to sync across devices and unlock Pro features.`,
    },
    {
      id: 2,
      title: 'Logging Annoyances',
      content: `Tap the + button to log a new snag.

1. Describe what annoyed you
2. Rate the intensity (1-10)
3. Pick a category
4. Save

Your entry will appear in your calendar and analytics.`,
    },
    {
      id: 3,
      title: 'Editing & Deleting',
      content: `You can edit entries for 72 hours after creation.

After 72 hours, entries lock permanently to maintain data integrity.

To delete: Open the entry → tap Delete → confirm.`,
    },
    {
      id: 4,
      title: 'Categories',
      content: `Use default categories or create your own.

To manage categories:
Settings → Manage Categories

Free: 1 custom category
Pro: Up to 20 custom categories

Customize with emoji and colors.`,
    },
    {
      id: 5,
      title: 'Calendar View',
      content: `Colors show your day's mood:

Green: 1-3 annoyances (good day)
Yellow: 4-6 annoyances (rough day)
Red: 7+ annoyances (tough day)
Gray: No entries

Tap any day to see details.`,
    },
    {
      id: 6,
      title: 'Analytics (Pro)',
      content: `Pro users get:

- Streak tracking
- Top triggers
- AI-powered insights
- Weekly/monthly trends
- Personalized tips

Upgrade in Settings to unlock.`,
    },
    {
      id: 7,
      title: 'Export Your Data (Pro)',
      content: `Pro users can export all data as CSV.

Settings → Export Data

Choose email or save to device.

Your export includes dates, categories, descriptions, and ratings.`,
    },
    {
      id: 8,
      title: 'Guest to Account Sync',
      content: `Using guest mode? Your data syncs when you create an account.

Sign Up → All guest data transfers automatically.

Your local data moves to the cloud for cross-device access.`,
    },
    {
      id: 9,
      title: 'Clearing Data',
      content: `To clear all data:
Settings → Clear All Data

This deletes:
- All annoyance logs
- Custom categories

Your account stays active.`,
    },
    {
      id: 10,
      title: 'Notifications',
      content: `Enable daily reminders to log consistently.

Settings → Notifications toggle

Notifications help build the habit of tracking patterns.`,
    },
  ];

  return (
    <LinearGradient
      colors={['#6A0DAD', '#4A0080', '#2D004D']}
      style={styles.container}
    >
      {/* Floating blobs */}
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob1,
          {
            transform: [
              {
                translateY: blob1Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -28],
                })
              },
              { rotate: '10deg' }
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob2,
          {
            transform: [
              {
                translateY: blob2Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 23],
                })
              },
              { rotate: '-16deg' }
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob3,
          {
            transform: [
              {
                translateY: blob3Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                })
              },
              { rotate: '24deg' }
            ]
          }
        ]} 
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>How can we help?</Text>
          <Text style={styles.introText}>
            Find answers to common questions below. Tap any section to expand.
          </Text>
        </View>

        {/* Collapsible Sections */}
        {helpSections.map((section) => (
          <View key={section.id} style={styles.accordionItem}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection(section.id)}
            >
              <Text style={styles.accordionTitle}>{section.title}</Text>
              <Text style={styles.accordionIcon}>
                {expandedSection === section.id ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            {expandedSection === section.id && (
              <View style={styles.accordionContent}>
                <Text style={styles.accordionText}>{section.content}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still Need Help?</Text>
          <Text style={styles.contactText}>
            Can't find what you're looking for? Contact our support team.
          </Text>
          <TouchableOpacity 
            style={styles.contactBtn}
            onPress={() => navigation.navigate('ContactSupport')}
          >
            <Text style={styles.contactBtnText}>Contact Support</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
  backBtn: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  introCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  introTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  introText: { fontSize: 15, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 22 },
  accordionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  accordionTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', flex: 1 },
  accordionIcon: { fontSize: 24, color: '#FFF', fontWeight: '300', marginLeft: 12 },
  accordionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  accordionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    marginTop: 12,
  },
  contactTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  contactText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', marginBottom: 20 },
  contactBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  contactBtnText: { color: '#6A0DAD', fontSize: 15, fontWeight: '700' },
});