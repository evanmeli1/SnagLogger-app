// screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { supabase } from '../supabase';
import { useIsFocused } from '@react-navigation/native';

export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState('Dark');
  const [isPro, setIsPro] = useState(false);
  const [user, setUser] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    const loadProStatus = async () => {
      const stored = await AsyncStorage.getItem('isPro');
      if (stored === 'true') setIsPro(true);
    };
    loadProStatus();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('isPro', isPro ? 'true' : 'false');
  }, [isPro]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    if (isFocused) loadUser();
  }, [isFocused]);

  const exportData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Login Required', 'Please log in to export your data.');
      return;
    }
    if (!isPro) {
      Alert.alert('Pro Required', 'Exporting data is a Pro feature. Upgrade to unlock.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('annoyances')
        .select('*')
        .eq('user_id', user.id);
      if (error || !data) {
        Alert.alert('Error', 'Could not fetch your data.');
        return;
      }

      const header = 'id,text,rating,category,created_at\n';
      const rows = data
        .map(
          (e) =>
            `${e.id},"${e.text.replace(/"/g, '""')}",${e.rating},${e.category_id},${e.created_at}`
        )
        .join('\n');
      const csv = header + rows;

      const fileUri = FileSystem.documentDirectory + 'snag-logs.csv';
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>

        {/* Keep Upgrade button */}
        <TouchableOpacity
          style={styles.proRow}
          onPress={() => {
            if (!isPro) {
              setIsPro(true);
              Alert.alert("🎉 Pro Unlocked!", "You now have full access to Pro features.");
            } else {
              Alert.alert("✅ You're already Pro!");
            }
          }}
        >
          <Text style={styles.proText}>
            {isPro ? '✅ You are Pro' : '💎 Upgrade to Pro ($2.99/month)'}
          </Text>
        </TouchableOpacity>

        {/* Show account management BELOW upgrade */}
        {user ? (
          <>
            <View style={styles.row}>
              <Text style={styles.rowText}>📧 {user.email}</Text>
            </View>
            <TouchableOpacity
              style={styles.proRow}
              onPress={async () => {
                await supabase.auth.signOut();
                setUser(null);
                Alert.alert("Logged Out", "You have been logged out.");
              }}
            >
              <Text style={styles.proText}>🚪 Log Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.proRow}
              onPress={() => navigation.navigate("SignUp", { syncGuest: true })}
            >
              <Text style={styles.proText}>🆕 Create Account & Sync</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.proRow}
              onPress={() => navigation.navigate("SignIn")}
            >
              <Text style={styles.proText}>🔑 Log In</Text>
            </TouchableOpacity>
          </>
        )}

        {/* App Settings */}
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>🔔 Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ true: '#D1BAF5', false: '#ddd' }}
            thumbColor={notificationsEnabled ? '#6A0DAD' : '#ccc'}
          />
        </View>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('ManageCategories')}
        >
          <Text style={styles.rowText}>✏️ Manage Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('ThemeScreen')}
        >
          <Text style={styles.rowText}>🎨 App Theme: {theme} ▼</Text>
        </TouchableOpacity>

        {/* Data */}
        <Text style={styles.sectionTitle}>Your Data</Text>
        <TouchableOpacity style={styles.row} onPress={exportData}>
          <Text style={styles.rowText}>
            📤 Export Data {isPro ? '' : '🔒'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Alert.alert('Clear', 'Clear All Data tapped!')}
        >
          <Text style={[styles.rowText, { color: '#B00020' }]}>
            🗑️ Clear All Data
          </Text>
        </TouchableOpacity>

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Alert.alert('Support', 'Contact Support tapped!')}
        >
          <Text style={styles.rowText}>💬 Contact Support</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Alert.alert('Rate', 'Rate App tapped!')}
        >
          <Text style={styles.rowText}>⭐ Rate App</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Alert.alert('Privacy', 'Privacy Policy tapped!')}
        >
          <Text style={styles.rowText}>🔒 Privacy Policy</Text>
        </TouchableOpacity>

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Alert.alert('Help', 'Help tapped!')}
        >
          <Text style={styles.rowText}>📚 Help</Text>
        </TouchableOpacity>
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backBtn: { fontSize: 16, color: '#6A0DAD', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowText: { fontSize: 16, color: '#333' },
  proRow: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#E8D5FF',
    borderRadius: 8,
  },
  proText: { fontSize: 16, color: '#6A0DAD', fontWeight: '600' },
  version: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#999',
    fontSize: 12,
  },
});
