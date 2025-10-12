import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as MailComposer from 'expo-mail-composer';
import * as Linking from 'expo-linking';
import { ThemeContext } from '../utils/ThemeContext';
import { supabase } from '../supabase';

export default function ContactSupportScreen({ navigation }) {
  const { theme, mode } = useContext(ThemeContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General Question');
  const [sending, setSending] = useState(false);

  const MAX_NAME_LENGTH = 50;
  const MAX_EMAIL_LENGTH = 100;
  const MAX_MESSAGE_LENGTH = 1000;

  const categories = ['Bug Report', 'Feature Request', 'General Question', 'Other'];

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
    createFloatingAnimation(blob1Float, 4500).start();
    createFloatingAnimation(blob2Float, 5000).start();
    createFloatingAnimation(blob3Float, 4200).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
      } catch {}
    })();
  }, []);

  const handleSendMessage = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing Info', 'Please fill out all fields before sending.');
      return;
    }

    if (name.length > MAX_NAME_LENGTH) {
      Alert.alert('Name Too Long', `Name must be under ${MAX_NAME_LENGTH} characters.`);
      return;
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      Alert.alert('Email Too Long', `Email must be under ${MAX_EMAIL_LENGTH} characters.`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      Alert.alert('Message Too Long', `Message must be under ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setSending(true);
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      const subject = `[${category}] Support Request from ${name}`;
      const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: ['support@petcue.com'],
          subject,
          body,
        });
      } else {
        const mailUrl = `mailto:support@petcue.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        await Linking.openURL(mailUrl);
      }

      setName('');
      setEmail('');
      setMessage('');
      setCategory('General Question');
    } catch (err) {
      Alert.alert('Error', 'Failed to send message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      <Animated.View 
        style={[
          styles.blob, styles.blob1,
          { backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})` },
          { transform: [{ translateY: blob1Float.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) }, { rotate: '15deg' }] }
        ]}
      />
      <Animated.View 
        style={[
          styles.blob, styles.blob2,
          { backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})` },
          { transform: [{ translateY: blob2Float.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }, { rotate: '-20deg' }] }
        ]}
      />
      <Animated.View 
        style={[
          styles.blob, styles.blob3,
          { backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})` },
          { transform: [{ translateY: blob3Float.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) }, { rotate: '25deg' }] }
        ]}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.backBtn, { color: theme.text }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Contact Support</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>How can we help?</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Fill out the form below and we'll get back to you soon.</Text>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    { 
                      backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                      borderColor: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)',
                    },
                    category === cat && { backgroundColor: theme.accent, borderColor: theme.accent },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryText, { color: theme.textSecondary }, category === cat && { color: '#FFF' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Your Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.1)',
                    color: theme.text,
                    borderColor: mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)',
                  }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                maxLength={MAX_NAME_LENGTH}
                placeholderTextColor={mode === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Your Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.1)',
                    color: theme.text,
                    borderColor: mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)',
                  }
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                maxLength={MAX_EMAIL_LENGTH}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={mode === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Message</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { 
                    backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.1)',
                    color: theme.text,
                    borderColor: mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)',
                  }
                ]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue or question..."
                maxLength={MAX_MESSAGE_LENGTH}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor={mode === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={{ alignSelf: 'flex-end', fontSize: 12, color: theme.textSecondary }}>
                {message.length} / {MAX_MESSAGE_LENGTH}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: theme.accent }, sending && { opacity: 0.6 }]}
              onPress={handleSendMessage}
              disabled={sending}
            >
              <Text style={[styles.sendBtnText, { color: '#FFF' }]}>{sending ? 'Sending...' : 'Send Message'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.faqCard, { backgroundColor: theme.surface, borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Text style={[styles.faqTitle, { color: theme.text }]}>Quick Help</Text>
            
            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, { color: theme.text }]}>How do I export my data?</Text>
              <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                Go to Settings → Export Data (Pro feature required)
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, { color: theme.text }]}>Can I edit old entries?</Text>
              <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                Yes, but only within 72 hours of creation. After that, entries are locked.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, { color: theme.text }]}>How do I create custom categories?</Text>
              <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                Go to Settings → Manage Categories → Add Category
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blob: { position: 'absolute', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 100 },
  blob1: { width: 150, height: 250, top: 80, left: -50 },
  blob2: { width: 120, height: 200, top: 300, right: -40 },
  blob3: { width: 100, height: 170, bottom: 150, left: 30 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 20 },
  backBtn: { fontSize: 16, color: '#FFF', fontWeight: '600', letterSpacing: 0.3 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: 0.2 },
  card: { marginHorizontal: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 8, letterSpacing: 0.2 },
  cardSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 24, fontWeight: '500', letterSpacing: 0.2 },
  label: { fontSize: 13, fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)', marginBottom: 8, letterSpacing: 0.4 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  categoryBtnActive: { backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: '#FFF' },
  categoryText: { fontSize: 13, fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 0.3 },
  categoryTextActive: { color: '#FFF' },
  inputContainer: { marginBottom: 20 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', fontWeight: '500' },
  textArea: { height: 120, paddingTop: 14 },
  sendBtn: { backgroundColor: '#FFF', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  sendBtnText: { color: '#6A0DAD', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  faqCard: { marginHorizontal: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  faqTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 16, letterSpacing: 0.3 },
  faqItem: { marginBottom: 16 },
  faqQuestion: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 6, letterSpacing: 0.2 },
  faqAnswer: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 20, fontWeight: '500' },
});
