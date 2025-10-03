// screens/PrivacyPolicyScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrivacyPolicyScreen({ navigation }) {
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

    createFloatingAnimation(blob1Float, 4800).start();
    createFloatingAnimation(blob2Float, 5200).start();
    createFloatingAnimation(blob3Float, 4400).start();
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      id: 1,
      title: 'Information We Collect',
      content: `We collect:
- Email & password (for accounts)
- Your annoyance logs & ratings
- Custom categories
- Device info & push tokens (if enabled)

Guest data stays local on your device.`,
    },
    {
      id: 2,
      title: 'How We Use Your Data',
      content: `Your data is used to:
- Provide app functionality
- Sync across devices
- Generate Pro analytics
- Process subscriptions
- Send notifications (if enabled)

We never sell or share your data for ads.`,
    },
    {
      id: 3,
      title: 'Third-Party Services',
      content: `We use these services:

Supabase - Database & auth
RevenueCat - Subscriptions
Stripe - Payments (we don't store card info)
Expo - Push notifications

Each has their own privacy policy.`,
    },
    {
      id: 4,
      title: 'Data Security',
      content: `Your data is protected with:
- SSL/TLS encryption
- Hashed passwords
- Secure cloud storage (US servers)

Guest data stored locally using AsyncStorage.`,
    },
    {
      id: 5,
      title: 'Your Rights',
      content: `You can:
- Access your data anytime
- Export as CSV (Pro)
- Delete entries (within 72 hours)
- Clear all data from Settings
- Delete your account completely

Contact us to exercise these rights.`,
    },
    {
      id: 6,
      title: 'Data Retention',
      content: `We keep data until you delete it:
- Account data: Until account deletion
- Annoyances: Until you delete them
- Deleted data: Removed within 30 days`,
    },
    {
      id: 7,
      title: 'International Users',
      content: `Data stored in US servers. By using the app, you consent to this transfer.

EU/UK users: We comply with GDPR.
California users: You have CCPA rights.`,
    },
    {
      id: 8,
      title: 'Children\'s Privacy',
      content: `Not for users under 13. We don't knowingly collect children's data.

If we discover we have, we'll delete it immediately.`,
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
                  outputRange: [0, -30],
                })
              },
              { rotate: '12deg' }
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
                  outputRange: [0, 25],
                })
              },
              { rotate: '-18deg' }
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
                  outputRange: [0, -22],
                })
              },
              { rotate: '28deg' }
            ]
          }
        ]} 
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Your Privacy Matters</Text>
          <Text style={styles.introText}>
            We protect your data and never sell it. Tap each section below to learn more.
          </Text>
          <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
        </View>

        {/* Collapsible Sections */}
        {sections.map((section) => (
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
          <Text style={styles.contactTitle}>Questions?</Text>
          <Text style={styles.contactText}>
            Contact us for data requests or privacy concerns.
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@petcue.net')}>
            <Text style={styles.emailText}>support@petcue.net</Text>
          </TouchableOpacity>
          <Text style={styles.devInfo}>
            Developer: Evan Li
          </Text>
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
  blob1: { width: 140, height: 230, top: 100, left: -45 },
  blob2: { width: 110, height: 190, top: 400, right: -35 },
  blob3: { width: 95, height: 160, bottom: 200, left: 25 },
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
  introText: { fontSize: 15, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 22, marginBottom: 12 },
  lastUpdated: { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic' },
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
  contactText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', marginBottom: 16 },
  emailText: { fontSize: 16, color: '#FFF', fontWeight: '600', textDecorationLine: 'underline' },
  devInfo: { fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginTop: 16 },
});