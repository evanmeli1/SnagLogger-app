// screens/SettingsScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as StoreReview from 'expo-store-review';
import { supabase } from '../supabase';
import { useIsFocused } from '@react-navigation/native';
import { 
  fetchProStatus, 
  presentPaywall, 
  restorePurchases,
  syncSubscriptionStatus,
  getOfferingDetails 
} from '../utils/subscriptions';

export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState('Dark');
  const [isPro, setIsPro] = useState(false);
  const [isLoadingProStatus, setIsLoadingProStatus] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [proStatus, setProStatus] = useState(null);
  const [offeringDetails, setOfferingDetails] = useState(null);
  const isFocused = useIsFocused();

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

  // Load user and Pro status when screen is focused
  useEffect(() => {
    const loadUserAndProStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Sync with RevenueCat first
        await syncSubscriptionStatus();
        
        // Then fetch from database
        const status = await fetchProStatus();
        setIsPro(status.isPro);
        setProStatus(status);

        // Load offering details for display
        const details = await getOfferingDetails();
        setOfferingDetails(details);
        setIsLoadingProStatus(false);
      } else {
        setIsPro(false);
        setProStatus(null);
        setIsLoadingProStatus(false);
      }
    };

    if (isFocused) {
      loadUserAndProStatus();
    }
  }, [isFocused]);

  const handleUpgradeToPro = async () => {
    // If already Pro, show manage subscription message
    if (isPro) {
      Alert.alert(
        '✨ You\'re Already Pro!',
        'You\'re currently subscribed to Pro. Manage your subscription in the App Store.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user) {
      Alert.alert(
        '🔐 Account Required',
        'You need to create an account to subscribe to Pro.',
        [
          { text: 'Create Account', onPress: () => navigation.navigate('SignUp', { syncGuest: true }) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    setLoading(true);
    const result = await presentPaywall();
    setLoading(false);

    if (result.success) {
      Alert.alert(
        '🎉 Welcome to Pro!',
        'Your 7-day free trial has started. Enjoy all premium features!',
        [{ text: 'Awesome!', onPress: () => {
          setIsPro(true);
          // Refresh status
          fetchProStatus().then(status => {
            setIsPro(status.isPro);
            setProStatus(status);
          });
        }}]
      );
    } else if (result.mustLogin) {
      Alert.alert('Login Required', 'Please log in to purchase Pro.');
    } else if (result.cancelled) {
      // User cancelled, do nothing
    } else {
      Alert.alert('Error', result.error || 'Could not complete purchase. Please try again.');
    }
  };

  const handleRestorePurchases = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You must be logged in to restore purchases.');
      return;
    }

    setLoading(true);
    const result = await restorePurchases();
    setLoading(false);

    if (result.success) {
      if (result.isPro) {
        Alert.alert('✅ Restored!', 'Your Pro subscription has been restored.');
        setIsPro(true);
        // Refresh status
        fetchProStatus().then(status => {
          setIsPro(status.isPro);
          setProStatus(status);
        });
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
      }
    } else {
      Alert.alert('Error', result.error || 'Could not restore purchases.');
    }
  };

  const exportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Login Required', 'Please log in to export your data.');
        return;
      }
      if (!isPro) {
        Alert.alert('Pro Required', 'Exporting data is a Pro feature. Upgrade to unlock.');
        return;
      }

      const { data: annoyances, error: annoyError } = await supabase
        .from('annoyances')
        .select('*')
        .eq('user_id', user.id);

      if (annoyError || !annoyances) {
        Alert.alert('Error', 'Could not fetch your data.');
        return;
      }

      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .or(`is_default.eq.true,user_id.eq.${user.id}`);

      if (catError) {
        Alert.alert('Error', 'Could not fetch categories.');
        return;
      }

      const getCategoryName = (categoryId) => {
        const match = categories.find(c => c.id === categoryId);
        return match ? `${match.emoji || ''} ${match.name}`.trim() : 'Uncategorized';
      };

      const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      };

      const sortedAnnoyances = [...annoyances].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      const header = 'Date,Category,Annoyance,Rating\n';
      const rows = sortedAnnoyances
        .map(
          (e) =>
            `"${formatDate(e.created_at)}","${getCategoryName(e.category_id)}","${e.text.replace(/"/g, '""')}",${e.rating}/10`
        )
        .join('\n');
      const csv = header + rows;

      const fileUri = `${FileSystem.cacheDirectory}snag-logs.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv);

      Alert.alert('📤 Export Data', 'Choose how to export your data:', [
        {
          text: 'Email',
          onPress: async () => {
            const isAvailable = await MailComposer.isAvailableAsync();
            if (isAvailable) {
              await MailComposer.composeAsync({
                subject: 'Your Snag Logs Export',
                body: 'Attached is your snag logs export.',
                attachments: [fileUri],
              });
            } else {
              Alert.alert('Not Supported', 'Email export is not available on this device.');
            }
          },
        },
        {
          text: 'Save/Share',
          onPress: async () => {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'text/csv',
              dialogTitle: 'Save or Share your Snag Logs export',
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Something went wrong: ' + err.message);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete:\n• All your logged annoyances\n• All custom categories\n\nYour account will remain active. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '🚨 Final Warning',
              'Are you absolutely sure? All your snag logs will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    await clearAllUserData();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const clearAllUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('annoyances').delete().eq('user_id', user.id);
        await supabase.from('categories').delete().eq('user_id', user.id);
      } else {
        await AsyncStorage.removeItem('guest_annoyances');
        await AsyncStorage.removeItem('guest_categories');
      }
      
      Alert.alert('✅ Data Cleared', 'All your data has been deleted.');
    } catch (err) {
      Alert.alert('Error', 'Failed to clear data: ' + err.message);
    }
  };

  const handleRateApp = async () => {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
    } else {
      Alert.alert('Not Available', 'Rating is not available on this device.');
    }
  };

  if (isLoadingProStatus) {
    return (
      <LinearGradient
        colors={['#E8B5E8', '#D9B8F5', '#F5C9E8', '#FAD9F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#333' }}>Logging...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#E8B5E8', '#D9B8F5', '#F5C9E8', '#FAD9F1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Pro Status Card */}
        <LinearGradient
          colors={isPro ? ['#FFD700', '#FFA500'] : ['#6A0DAD', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.proCard}
        >
          {loading ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.proSubtitle}>Processing...</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleUpgradeToPro}
              disabled={isPro}
            >
              <Text style={styles.proTitle}>
                {isPro ? '✨ Pro Member' : '💎 Upgrade to Pro'}
              </Text>
              <Text style={styles.proSubtitle}>
                {isPro 
                  ? proStatus?.status === 'cancelled' 
                    ? `Active until ${new Date(proStatus.expiresAt).toLocaleDateString()}`
                    : 'Enjoying all premium features'
                  : 'Unlock analytics, export data & more'
                }
              </Text>
              {!isPro && (
                <Text style={styles.proPrice}>
                  {offeringDetails ? offeringDetails.price : '$2.99'}/month • 7-day free trial
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          {user && !isPro && (
            <TouchableOpacity 
              style={styles.restoreBtn}
              onPress={handleRestorePurchases}
            >
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {user ? (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardIcon}>📧</Text>
                <Text style={styles.cardText}>{user.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={async () => {
                  await supabase.auth.signOut();
                  setUser(null);
                  setIsPro(false);
                  Alert.alert("Logged Out", "You have been logged out.");
                }}
              >
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.authBtn}
                onPress={() => navigation.navigate("SignUp", { syncGuest: true })}
              >
                <Text style={styles.authIcon}>🆕</Text>
                <Text style={styles.authText}>Create Account & Sync</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.authBtn}
                onPress={() => navigation.navigate("SignIn")}
              >
                <Text style={styles.authIcon}>🔑</Text>
                <Text style={styles.authText}>Log In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🔔</Text>
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ true: '#6A0DAD', false: '#ddd' }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.cardDivider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('ManageCategories')}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>✏️</Text>
                <Text style={styles.settingText}>Manage Categories</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.cardDivider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('ThemeScreen')}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🎨</Text>
                <Text style={styles.settingText}>App Theme</Text>
              </View>
              <Text style={styles.themeBadge}>{theme}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingRow} onPress={exportData}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>📤</Text>
                <Text style={styles.settingText}>Export Data</Text>
              </View>
              {!isPro && <Text style={styles.lockBadge}>🔒 Pro</Text>}
            </TouchableOpacity>
            <View style={styles.cardDivider} />
            <TouchableOpacity style={styles.settingRow} onPress={handleClearData}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🗑️</Text>
                <Text style={[styles.settingText, { color: '#D32F2F' }]}>Clear All Data</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Info</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('ContactSupport')}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>💬</Text>
                <Text style={styles.settingText}>Contact Support</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.cardDivider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleRateApp}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>⭐</Text>
                <Text style={styles.settingText}>Rate App</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.cardDivider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🔒</Text>
                <Text style={styles.settingText}>Privacy Policy</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.cardDivider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('Help')}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>📚</Text>
                <Text style={styles.settingText}>Help</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blob: {
    position: 'absolute',
    backgroundColor: 'rgba(186, 156, 237, 0.15)',
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
    top: 350,
    right: -40,
  },
  blob3: {
    width: 100,
    height: 170,
    bottom: 200,
    left: 30,
  },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backBtn: { fontSize: 16, color: '#6A0DAD', fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#333' },
  
  // Pro Card
  proCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  proTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 6 },
  proSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 8 },
  proPrice: { fontSize: 18, fontWeight: '600', color: '#FFF', marginTop: 4 },
  restoreBtn: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  restoreText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // Section
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  
  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Account Card
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: { fontSize: 20, marginRight: 12 },
  cardText: { fontSize: 16, color: '#333', fontWeight: '500' },
  logoutBtn: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#D32F2F' },
  
  // Auth Buttons
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  authIcon: { fontSize: 20, marginRight: 12 },
  authText: { fontSize: 16, fontWeight: '600', color: '#333' },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  
  // Setting Row
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: { fontSize: 20, marginRight: 12 },
  settingText: { fontSize: 16, color: '#333', fontWeight: '500' },
  arrow: { fontSize: 22, color: '#999', fontWeight: '300' },
  themeBadge: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  lockBadge: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  
  version: {
    textAlign: 'center',
    marginTop: 24,
    color: '#999',
    fontSize: 12,
  },
});