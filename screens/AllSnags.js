// screens/AllSnags.js
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput as RNTextInput,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';

export default function AllSnags({ route, navigation }) {
  const { annoyances: initialAnnoyances } = route.params || { annoyances: [] };

  const [annoyances, setAnnoyances] = useState(initialAnnoyances);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("both");
  const [activeFilters, setActiveFilters] = useState([]); // 'high', 'medium', 'low', 'week'

  const [categories, setCategories] = useState([]); // ✅ dynamic categories

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

  // Load categories dynamically (default + custom)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .or(`is_default.eq.true,user_id.eq.${user.id}`);
          if (!error) setCategories(data || []);
        } else {
          // guest fallback
          const stored = await AsyncStorage.getItem('guest_categories');
          setCategories(stored ? JSON.parse(stored) : []);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    loadCategories();
  }, []);

  // ✅ Lookup category name dynamically
  const getCategoryLabel = (entry) => {
    if (!entry) return "❓ Uncategorized";

    // Guest entries may store category_label instead of category_id
    if (entry.category_label) return entry.category_label;

    // Convert both sides to strings to avoid ID type mismatches
    const entryId = String(entry.category_id);
    const match = categories.find(c => String(c.id) === entryId);

    if (match) return `${match.emoji || '❓'} ${match.name}`;
    return "❓ Uncategorized";
  };

  const getRatingColor = (rating) => {
    if (rating <= 3) return '#4CAF50'; // green
    if (rating <= 7) return '#FFC107'; // yellow/gold
    return '#F44336'; // red
  };

  const renderRatingDots = (rating) => {
    const color = getRatingColor(rating);
    const filledDots = Math.ceil(rating / 2); // 10 scale -> 5 dots
    
    return (
      <View style={styles.ratingDots}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.dot,
              { backgroundColor: i < filledDots ? color : '#ddd' }
            ]} 
          />
        ))}
      </View>
    );
  };

  const toggleFilter = (filter) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
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
            category_id: selectedEntry.category_id, // ✅ only save id
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
    // Text/Category search
    const matchesText = a.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = getCategoryLabel(a)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    let matchesSearch = true;
    if (searchQuery.trim()) {
      if (searchMode === "text") matchesSearch = matchesText;
      else if (searchMode === "category") matchesSearch = matchesCategory;
      else matchesSearch = matchesText || matchesCategory;
    }

    // Filter chips
    if (activeFilters.length === 0) return matchesSearch;

    const rating = a.rating || 0;
    const createdAt = new Date(a.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let matchesFilters = false;
    
    if (activeFilters.includes('high') && rating >= 8) matchesFilters = true;
    if (activeFilters.includes('medium') && rating >= 4 && rating <= 7) matchesFilters = true;
    if (activeFilters.includes('low') && rating <= 3) matchesFilters = true;
    if (activeFilters.includes('week') && createdAt >= weekAgo) matchesFilters = true;

    return matchesSearch && matchesFilters;
  });

  // ✅ Sort newest first
  const sortedAnnoyances = [...filteredAnnoyances].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      locations={[0, 0.5, 1]}
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
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Search snags..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
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
                <View style={styles.cardTop}>
                  <Text style={styles.snagText}>• {item.text}</Text>
                  {renderRatingDots(item.rating)}
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{getCategoryLabel(item)}</Text>
                  </View>
                  <Text style={styles.snagTime}>
                    {new Date(item.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 0,
  },
  modeToggle: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  modeOption: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)', padding: 6 },
  modeSelected: { color: '#fff', textDecorationLine: 'underline' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  snagCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  snagText: { 
    fontSize: 16, 
    color: '#fff', 
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  ratingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  snagTime: { fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
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
