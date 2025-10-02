// screens/EditEntriesScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export default function EditEntriesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const entry = route.params?.entry;

  const [text, setText] = useState(entry?.text || '');
  const [rating, setRating] = useState(entry?.rating || 5);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    let timer;

    const updateLockStatus = () => {
      if (!entry?.created_at) return;

      const createdAt = new Date(entry.created_at);
      const deadline = new Date(createdAt.getTime() + 72 * 60 * 60 * 1000); // +3 days
      const now = new Date();
      const diffMs = deadline - now;

      if (diffMs <= 0) {
        setLocked(true);
        setTimeLeft(null);
      } else {
        setLocked(false);

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const days = Math.floor(diffMinutes / (60 * 24));
        const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
        const minutes = diffMinutes % 60;

        if (days > 0) {
          setTimeLeft(
            `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`
          );
        } else if (hours > 0) {
          setTimeLeft(
            `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`
          );
        } else {
          setTimeLeft(
            `${minutes} min${minutes !== 1 ? 's' : ''}`
          );
        }
      }
    };

    updateLockStatus();
    timer = setInterval(updateLockStatus, 60 * 1000); // refresh every minute

    return () => clearInterval(timer);
  }, [entry]);

  const handleSave = async () => {
    if (locked) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('annoyances')
          .update({ text, rating })
          .eq('id', entry.id);

        if (error) throw error;
      } else {
        const stored = await AsyncStorage.getItem('guest_annoyances');
        let annoyances = stored ? JSON.parse(stored) : [];
        annoyances = annoyances.map(a =>
          a.id === entry.id ? { ...a, text, rating } : a
        );
        await AsyncStorage.setItem('guest_annoyances', JSON.stringify(annoyances));
      }

      Alert.alert('Success', 'Entry updated!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = async () => {
    if (locked) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('annoyances')
          .delete()
          .eq('id', entry.id);

        if (error) throw error;
      } else {
        const stored = await AsyncStorage.getItem('guest_annoyances');
        let annoyances = stored ? JSON.parse(stored) : [];
        annoyances = annoyances.filter(a => a.id !== entry.id);
        await AsyncStorage.setItem('guest_annoyances', JSON.stringify(annoyances));
      }

      Alert.alert('Deleted', 'Entry removed!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Annoyance</Text>
        <View style={{ width: 60 }} /> 
      </View>

      {/* Lock Banner */}
      {locked ? (
        <Text style={styles.lockBanner}>🔒 This entry can no longer be edited</Text>
      ) : (
        <Text style={styles.lockBanner}>⚠️ This entry locks in {timeLeft}</Text>
      )}

      {/* Form */}
      <Text style={styles.label}>What annoyed you?</Text>
      <TextInput
        style={[styles.input, locked && { backgroundColor: '#eee' }]}
        value={text}
        onChangeText={setText}
        editable={!locked}
      />

      <Text style={styles.label}>How annoying was it?</Text>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={rating}
        onValueChange={setRating}
        disabled={locked}
      />
      <Text style={styles.sliderValue}>{rating}/10</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, locked && styles.disabled]}
          onPress={handleSave}
          disabled={locked}
        >
          <Text style={styles.btnText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnDelete, locked && styles.disabled]}
          onPress={handleDelete}
          disabled={locked}
        >
          <Text style={styles.btnText}>Delete Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: { fontSize: 16, color: '#6A0DAD' },
  title: { fontSize: 18, fontWeight: '700', color: '#333' },

  lockBanner: {
    textAlign: 'center',
    color: '#B00020',
    marginBottom: 16,
    fontWeight: '600',
  },

  label: { fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  sliderValue: { textAlign: 'center', marginBottom: 20 },

  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: {
    flex: 1,
    backgroundColor: '#6A0DAD',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  btnDelete: {
    flex: 1,
    backgroundColor: '#D32F2F',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
