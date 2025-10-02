// screens/AllSnags.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export default function AllSnags({ route, navigation }) {
  const { annoyances: initialAnnoyances } = route.params || { annoyances: [] };

  const [annoyances, setAnnoyances] = useState(initialAnnoyances);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("both"); 

  const defaultCategories = [
    { id: 1, emoji: '👥', name: 'People' },
    { id: 2, emoji: '🚗', name: 'Traffic' },
    { id: 3, emoji: '💻', name: 'Tech' },
    { id: 4, emoji: '🏢', name: 'Work' },
    { id: 5, emoji: '🏠', name: 'Home' },
    { id: 6, emoji: '💰', name: 'Money' },
    { id: 7, emoji: '🏥', name: 'Health' },
    { id: 8, emoji: '📱', name: 'Social' },
    { id: 9, emoji: '➕', name: 'Other' },
  ];

  const getCategoryLabel = (entry) => {
    if (!entry) return "Uncategorized";
    if (entry.category_label) return entry.category_label;
    const match = defaultCategories.find((c) => c.id === entry.category_id);
    if (match) return `${match.emoji} ${match.name}`;
    return "Custom Category";
  };

  useEffect(() => {
    let timer;
    const updateLockStatus = () => {
      if (selectedEntry?.created_at) {
        const createdAt = new Date(selectedEntry.created_at);
        const deadline = new Date(createdAt.getTime() + 72 * 60 * 60 * 1000);
        const now = new Date();
        const diffMs = deadline - now;

        if (diffMs <= 0) {
          setLocked(true);
          setTimeLeft(null);
        } else {
          setLocked(false);
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const days = Math.floor(diffHours / 24);
          const hours = diffHours % 24;
          if (days > 0) {
            setTimeLeft(
              `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`
            );
          } else {
            setTimeLeft(`${hours} hour${hours !== 1 ? 's' : ''}`);
          }
        }
      }
    };

    if (selectedEntry) {
      updateLockStatus();
      timer = setInterval(updateLockStatus, 60 * 1000);
    }

    return () => clearInterval(timer);
  }, [selectedEntry]);

  const handleSave = async () => {
    if (locked || !selectedEntry) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('annoyances')
          .update({
            text: selectedEntry.text,
            rating: selectedEntry.rating,
            category_id: selectedEntry.category_id,
            category_label: selectedEntry.category_label,
          })
          .eq('id', selectedEntry.id);
        if (error) throw error;
      } else {
        const stored = await AsyncStorage.getItem('guest_annoyances');
        let guestAnnoyances = stored ? JSON.parse(stored) : [];
        guestAnnoyances = guestAnnoyances.map((a) =>
          a.id === selectedEntry.id ? { ...a, ...selectedEntry } : a
        );
        await AsyncStorage.setItem('guest_annoyances', JSON.stringify(guestAnnoyances));
      }
      setAnnoyances((prev) =>
        prev.map((a) => (a.id === selectedEntry.id ? { ...a, ...selectedEntry } : a))
      );
      Alert.alert('Success', 'Entry updated!');
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = async () => {
    if (locked || !selectedEntry) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('annoyances').delete().eq('id', selectedEntry.id);
        if (error) throw error;
      } else {
        const stored = await AsyncStorage.getItem('guest_annoyances');
        let guestAnnoyances = stored ? JSON.parse(stored) : [];
        guestAnnoyances = guestAnnoyances.filter((a) => a.id !== selectedEntry.id);
        await AsyncStorage.setItem('guest_annoyances', JSON.stringify(guestAnnoyances));
      }
      setAnnoyances((prev) => prev.filter((a) => a.id !== selectedEntry.id));
      Alert.alert('Deleted', 'Entry removed!');
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const filteredAnnoyances = annoyances.filter((a) => {
    const matchesText = a.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = getCategoryLabel(a)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!searchQuery.trim()) return true;
    if (searchMode === "text") return matchesText;
    if (searchMode === "category") return matchesCategory;
    return matchesText || matchesCategory;
  });

  // ✅ Sort newest first
  const sortedAnnoyances = [...filteredAnnoyances].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <LinearGradient
      colors={['#E8D5FF', '#D1BAF5', '#B79CED']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Snags</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <RNTextInput
          style={styles.searchInput}
          placeholder="Search snags..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.modeToggle}>
          <TouchableOpacity onPress={() => setSearchMode("text")}>
            <Text style={[styles.modeOption, searchMode === "text" && styles.modeSelected]}>
              Text
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSearchMode("category")}>
            <Text style={[styles.modeOption, searchMode === "category" && styles.modeSelected]}>
              Category
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSearchMode("both")}>
            <Text style={[styles.modeOption, searchMode === "both" && styles.modeSelected]}>
              Both
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sortedAnnoyances.length === 0 ? (
          <Text style={styles.emptyText}>No snags found</Text>
        ) : (
          sortedAnnoyances.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setSelectedEntry(item);
                setModalVisible(true);
              }}
            >
              <View style={styles.snagCard}>
                <Text style={styles.snagText}>• {item.text}</Text>
                <Text style={styles.snagTime}>
                  {new Date(item.created_at).toLocaleString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Annoyance</Text>
            {locked ? (
              <Text style={styles.lockBanner}>🔒 This entry can no longer be edited</Text>
            ) : (
              <Text style={styles.lockBanner}>
                ⚠️ This entry locks in {timeLeft || 'less than 1 hour'}
              </Text>
            )}
            <RNTextInput
              style={[styles.modalInput, locked && { backgroundColor: '#eee' }]}
              value={selectedEntry?.text || ''}
              onChangeText={(t) => setSelectedEntry({ ...selectedEntry, text: t })}
              editable={!locked}
            />
            <Slider
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={selectedEntry?.rating || 5}
              onValueChange={(r) => setSelectedEntry({ ...selectedEntry, rating: r })}
              disabled={locked}
            />
            <Text style={{ textAlign: 'center' }}>{selectedEntry?.rating}/10</Text>
            <Text style={styles.categoryText}>
              Category: {getCategoryLabel(selectedEntry)}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.saveBtn, locked && styles.disabled]}
                onPress={handleSave}
                disabled={locked}
              >
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteBtn, locked && styles.disabled]}
                onPress={handleDelete}
                disabled={locked}
              >
                <Text style={styles.btnText}>Delete</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { fontSize: 16, fontWeight: '500', color: '#4A4A4A' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#4A4A4A' },
  searchContainer: { paddingHorizontal: 24, marginBottom: 12 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modeToggle: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  modeOption: { fontSize: 14, fontWeight: '600', color: '#666', padding: 6 },
  modeSelected: { color: '#6A0DAD', textDecorationLine: 'underline' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  snagCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  snagText: { fontSize: 16, color: '#333', marginBottom: 6 },
  snagTime: { fontSize: 12, color: '#999' },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 16, marginTop: 40 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  lockBanner: {
    textAlign: 'center',
    color: '#B00020',
    marginBottom: 12,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  categoryText: { marginTop: 8, textAlign: 'center', color: '#666' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#6A0DAD',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#D32F2F',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  cancelText: { textAlign: 'center', marginTop: 12, color: '#6A0DAD' },
});
