// screens/AllSnags.js - Themed & Polished
import React, { useState, useEffect, useRef, useContext } from 'react';
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
import { ThemeContext } from '../utils/ThemeContext';

export default function AllSnags({ route, navigation }) {
  const { theme, mode } = useContext(ThemeContext);
  const { annoyances: initialAnnoyances } = route.params || { annoyances: [] };

  const [annoyances, setAnnoyances] = useState(initialAnnoyances);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("both");
  const [activeFilters, setActiveFilters] = useState([]);

  const [categories, setCategories] = useState([]);

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
          const stored = await AsyncStorage.getItem('guest_categories');
          setCategories(stored ? JSON.parse(stored) : []);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    loadCategories();
  }, []);

  const getCategoryLabel = (entry) => {
    if (!entry) return "❓ Uncategorized";
    if (entry.category_label) return entry.category_label;
    const entryId = String(entry.category_id);
    const match = categories.find(c => String(c.id) === entryId);
    if (match) return `${match.emoji || '❓'} ${match.name}`;
    return "❓ Uncategorized";
  };

  const getRatingColor = (rating) => {
    if (rating <= 3) return theme.success;
    if (rating <= 7) return theme.warning;
    return theme.error;
  };

  const renderRatingDots = (rating) => {
    const color = getRatingColor(rating);
    const filledDots = Math.ceil(rating / 2);
    
    return (
      <View style={styles.ratingDots}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.dot,
              { backgroundColor: i < filledDots ? color : theme.border }
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
            category_id: selectedEntry.category_id,
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
    
    let matchesSearch = true;
    if (searchQuery.trim()) {
      if (searchMode === "text") matchesSearch = matchesText;
      else if (searchMode === "category") matchesSearch = matchesCategory;
      else matchesSearch = matchesText || matchesCategory;
    }

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

  const sortedAnnoyances = [...filteredAnnoyances].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Floating blobs */}
      <Animated.View 
        style={[
          styles.blob,
          {
            backgroundColor: `rgba(186, 156, 237, ${theme.blobOpacity})`,
            width: 150,
            height: 250,
            top: 80,
            left: -50,
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
          {
            backgroundColor: `rgba(186, 156, 237, ${theme.blobOpacity})`,
            width: 120,
            height: 200,
            top: 350,
            right: -40,
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
          {
            backgroundColor: `rgba(186, 156, 237, ${theme.blobOpacity})`,
            width: 100,
            height: 170,
            bottom: 200,
            left: 30,
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
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>All Snags</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchWrapper, { backgroundColor: theme.surface }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <RNTextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search snags..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.modeToggle}>
          <TouchableOpacity 
            onPress={() => setSearchMode("text")}
            style={[
              styles.modeButton,
              { backgroundColor: theme.surface },
              searchMode === "text" && { backgroundColor: theme.accent }
            ]}
          >
            <Text style={[
              styles.modeOption, 
              { color: theme.textSecondary },
              searchMode === "text" && { color: '#FFF' }
            ]}>
              Text
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setSearchMode("category")}
            style={[
              styles.modeButton,
              { backgroundColor: theme.surface },
              searchMode === "category" && { backgroundColor: theme.accent }
            ]}
          >
            <Text style={[
              styles.modeOption,
              { color: theme.textSecondary },
              searchMode === "category" && { color: '#FFF' }
            ]}>
              Category
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setSearchMode("both")}
            style={[
              styles.modeButton,
              { backgroundColor: theme.surface },
              searchMode === "both" && { backgroundColor: theme.accent }
            ]}
          >
            <Text style={[
              styles.modeOption,
              { color: theme.textSecondary },
              searchMode === "both" && { color: '#FFF' }
            ]}>
              Both
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sortedAnnoyances.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery.trim() ? 'No snags match your search' : 'No snags found'}
            </Text>
          </View>
        ) : (
          sortedAnnoyances.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setSelectedEntry(item);
                setModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.snagCard, { backgroundColor: theme.surface }]}>
                <View style={styles.cardTop}>
                  <Text style={[styles.snagText, { color: theme.text }]}>
                    • {item.text}
                  </Text>
                  {renderRatingDots(item.rating)}
                </View>
                <View style={styles.cardFooter}>
                  <View style={[styles.categoryPill, { 
                    backgroundColor: mode === 'light' 
                      ? 'rgba(106, 13, 173, 0.1)' 
                      : 'rgba(139, 92, 246, 0.2)',
                    borderColor: theme.accent
                  }]}>
                    <Text style={[styles.categoryPillText, { color: theme.accent }]}>
                      {getCategoryLabel(item)}
                    </Text>
                  </View>
                  <Text style={[styles.snagTime, { color: theme.textSecondary }]}>
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
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceSolid }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Snag</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {locked ? (
                <View style={[styles.lockBanner, { backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}>
                  <Ionicons name="lock-closed" size={20} color={theme.error} />
                  <Text style={[styles.lockText, { color: theme.error }]}>
                    This entry can no longer be edited
                  </Text>
                </View>
              ) : (
                <View style={[styles.lockBanner, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
                  <Ionicons name="time-outline" size={20} color={theme.warning} />
                  <Text style={[styles.lockText, { color: theme.warning }]}>
                    Locks in {timeLeft || 'less than 1 hour'}
                  </Text>
                </View>
              )}

              <RNTextInput
                style={[
                  styles.modalInput,
                  { 
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border
                  },
                  locked && { opacity: 0.5 }
                ]}
                value={selectedEntry?.text || ''}
                onChangeText={(t) => setSelectedEntry({ ...selectedEntry, text: t })}
                editable={!locked}
                multiline
              />

              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>
                  Annoyance Level
                </Text>
                <Slider
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={selectedEntry?.rating || 5}
                  onValueChange={(r) => setSelectedEntry({ ...selectedEntry, rating: r })}
                  disabled={locked}
                  minimumTrackTintColor={theme.accent}
                  maximumTrackTintColor={theme.border}
                  thumbTintColor={theme.accent}
                />
                <View style={styles.ratingDisplay}>
                  <Text style={[styles.ratingNumber, { color: theme.text }]}>
                    {selectedEntry?.rating}
                  </Text>
                  <Text style={[styles.ratingMax, { color: theme.textTertiary }]}>/10</Text>
                </View>
              </View>

              <View style={[styles.categoryBadge, { backgroundColor: theme.surface }]}>
                <Ionicons name="pricetag" size={16} color={theme.accent} />
                <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
                  {getCategoryLabel(selectedEntry)}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: theme.accent },
                    locked && styles.disabled
                  ]}
                  onPress={handleSave}
                  disabled={locked}
                >
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                  <Text style={styles.btnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deleteBtn,
                    { backgroundColor: theme.error },
                    locked && styles.disabled
                  ]}
                  onPress={handleDelete}
                  disabled={locked}
                >
                  <Ionicons name="trash" size={20} color="#FFF" />
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    borderRadius: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  
  // Search
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: { marginRight: 12 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  modeToggle: { 
    flexDirection: 'row', 
    gap: 8,
    marginTop: 12,
  },
  modeButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  modeOption: { 
    fontSize: 14, 
    fontWeight: '700',
  },
  
  // List
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: { 
    textAlign: 'center', 
    fontSize: 16, 
    marginTop: 16,
    fontWeight: '600',
  },
  snagCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  snagText: { 
    fontSize: 16, 
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  snagTime: { 
    fontSize: 12, 
    fontWeight: '600',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: '800',
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  lockText: {
    flex: 1,
    fontWeight: '700',
    fontSize: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    fontWeight: '500',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 8,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: '800',
  },
  ratingMax: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  categoryText: { 
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: { 
    flexDirection: 'row', 
    gap: 12,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  btnText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: { opacity: 0.5 },
});