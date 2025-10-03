// screens/ContactSupportScreen.js
import React, { useState, useRef, useEffect } from 'react';
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

export default function ContactSupportScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');

  const categories = ['Bug Report', 'Feature Request', 'General Question', 'Other'];

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

    createFloatingAnimation(blob1Float, 4500).start();
    createFloatingAnimation(blob2Float, 5000).start();
    createFloatingAnimation(blob3Float, 4200).start();
  }, []);

  const handleSendMessage = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing Info', 'Please fill out all fields before sending.');
      return;
    }

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: ['support@petcue.com'],
          subject: `[${category}] Support Request from ${name}`,
          body: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        });
        
        setName('');
        setEmail('');
        setMessage('');
        setCategory('General');
      } else {
        Alert.alert('Not Supported', 'Email is not available on this device.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send message: ' + err.message);
    }
  };

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
                  outputRange: [0, -25],
                })
              },
              { rotate: '15deg' }
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
                  outputRange: [0, 20],
                })
              },
              { rotate: '-20deg' }
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
                  outputRange: [0, -18],
                })
              },
              { rotate: '25deg' }
            ]
          }
        ]} 
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contact Support</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>How can we help?</Text>
            <Text style={styles.cardSubtitle}>
              Fill out the form below and we'll get back to you soon.
            </Text>

            {/* Category Selection */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    category === cat && styles.categoryBtnActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Your Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Message Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue or question..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
              <Text style={styles.sendBtnText}>Send Message</Text>
            </TouchableOpacity>
          </View>

          {/* FAQ Section */}
          <View style={styles.faqCard}>
            <Text style={styles.faqTitle}>Quick Help</Text>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>How do I export my data?</Text>
              <Text style={styles.faqAnswer}>
                Go to Settings → Export Data (Pro feature required)
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Can I edit old entries?</Text>
              <Text style={styles.faqAnswer}>
                Yes, but only within 72 hours of creation. After that, entries are locked.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>How do I create custom categories?</Text>
              <Text style={styles.faqAnswer}>
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
  blob: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 100,
  },
  blob1: {
    width: 150,
    height: 250,
    top: 80,
    left: -50,
  },
  blob2: {
    width: 120,
    height: 200,
    top: 300,
    right: -40,
  },
  blob3: {
    width: 100,
    height: 170,
    bottom: 150,
    left: 30,
  },
  scrollContent: { paddingBottom: 40 },
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
  card: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 24 },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: 'rgba(255, 255, 255, 0.9)', 
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: '#FFF',
  },
  categoryText: { fontSize: 13, fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' },
  categoryTextActive: { color: '#FFF' },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  sendBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendBtnText: { color: '#6A0DAD', fontSize: 16, fontWeight: '700' },
  faqCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  faqTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 16 },
  faqItem: { marginBottom: 16 },
  faqQuestion: { fontSize: 15, fontWeight: '600', color: '#FFF', marginBottom: 6 },
  faqAnswer: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 20 },
});