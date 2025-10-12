// screens/CalendarScreen.js - Themed & Beautiful
import React, { useState, useCallback, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../utils/ThemeContext';

export default function CalendarScreen({ navigation }) {
  const { theme, mode } = useContext(ThemeContext);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [annoyances, setAnnoyances] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null); 
  const [modalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);

  // Floating blob animations
  const blob1Float = useRef(new Animated.Value(0)).current;
  const blob2Float = useRef(new Animated.Value(0)).current;
  const blob3Float = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          let loaded = [];
          let loadedCategories = [];

          if (user) {
            const { data, error } = await supabase
              .from('annoyances')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(500);
            if (error) throw error;
            loaded = data || [];

            const { data: catData, error: catErr } = await supabase
              .from('categories')
              .select('*')
              .or(`user_id.eq.${user.id},is_default.eq.true`);
            if (!catErr) loadedCategories = catData || [];
          } else {
            const stored = await AsyncStorage.getItem('guest_annoyances');
            loaded = stored ? JSON.parse(stored) : [];

            const storedCats = await AsyncStorage.getItem('guest_categories');
            loadedCategories = storedCats ? JSON.parse(storedCats) : defaultCategories;
          }

          setAnnoyances(loaded);
          setCategories(loadedCategories);
          console.log('✅ Categories loaded:', loadedCategories.map(c => c.id));
          console.log('✅ First annoyances:', loaded.slice(0, 5).map(a => a.category_id));
        } catch (err) {
          console.log('Error loading data:', err.message);
        }
      };

      loadData();
    }, [])
  );

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

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

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
    const entryId = String(entry.category_id);
    let match =
      categories.find((c) => String(c.id) === entryId) ||
      defaultCategories.find((c) => String(c.id) === entryId);

    if (!match && entry.category_name) {
      match =
        categories.find((c) => c.name === entry.category_name) ||
        defaultCategories.find((c) => c.name === entry.category_name);
    }

    if (!match && !isNaN(Number(entry.category_id))) {
      const numericId = Number(entry.category_id);
      match = defaultCategories.find((c) => c.id === numericId);
    }

    return match ? `${match.emoji || "❓"} ${match.name}` : "Uncategorized";
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const grouped = {};
  annoyances.forEach((a) => {
    const d = new Date(a.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  const getColor = (day) => {
    const key = `${year}-${month}-${day}`;
    const entries = grouped[key] || [];
    if (entries.length === 0) return theme.border;
    if (entries.length <= 3) return theme.success;
    if (entries.length <= 6) return theme.warning;
    return theme.error;
  };

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const todayEntries = grouped[todayKey] || [];
  const avg =
    todayEntries.length > 0
      ? (todayEntries.reduce((s, e) => s + (e.rating || 0), 0) /
          todayEntries.length).toFixed(1)
      : 0;

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleDayPress = (day) => {
    const key = `${year}-${month}-${day}`;
    const entries = [...(grouped[key] || [])].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    setSelectedDay({ key, day, entries });
    setModalVisible(true);
  };

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.arrowBtn} 
            onPress={goToPrevMonth}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.monthTitle, { color: theme.text }]}>{monthNames[month]}</Text>
            <Text style={[styles.yearTitle, { color: theme.textSecondary }]}>{year}</Text>
          </View>
          <TouchableOpacity 
            style={styles.arrowBtn} 
            onPress={goToPrevMonth}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Days of week */}
        <View style={styles.weekRow}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <Text key={i} style={[styles.weekDay, { color: theme.text }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return (
              <TouchableOpacity key={day} style={styles.dayCell} onPress={() => handleDayPress(day)}>
                <View style={[
                  styles.dayCircle, 
                  { backgroundColor: getColor(day) },
                  isToday && { borderWidth: 2.5, borderColor: theme.accent }
                ]}>
                  <Text style={styles.dayText}>{day}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Key - Compact */}
        <View style={[styles.keyCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.keyTitle, { color: theme.text }]}>Key</Text>
          <View style={styles.keyGrid}>
            <View style={styles.keyItem}>
              <View style={[styles.keyDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.keyText, { color: theme.textSecondary }]}>1–3</Text>
            </View>
            <View style={styles.keyItem}>
              <View style={[styles.keyDot, { backgroundColor: theme.warning }]} />
              <Text style={[styles.keyText, { color: theme.textSecondary }]}>4–6</Text>
            </View>
            <View style={styles.keyItem}>
              <View style={[styles.keyDot, { backgroundColor: theme.error }]} />
              <Text style={[styles.keyText, { color: theme.textSecondary }]}>7+</Text>
            </View>
            <View style={styles.keyItem}>
              <View style={[styles.keyDot, { backgroundColor: theme.border }]} />
              <Text style={[styles.keyText, { color: theme.textSecondary }]}>None</Text>
            </View>
          </View>
        </View>

        {/* Today summary - Glassmorphism */}
        <View style={[styles.glassCard, { backgroundColor: theme.surface }]}>
          <View style={styles.todayHeader}>
            <Ionicons name="today" size={24} color={theme.accent} />
            <Text style={[styles.todayTitle, { color: theme.text }]}>
              Today, {monthNames[today.getMonth()]} {today.getDate()}
            </Text>
          </View>
          <Text style={[styles.todayStats, { color: theme.textSecondary }]}>
            {todayEntries.length} logged • Avg {avg}/10
          </Text>

          {todayEntries.length > 0 ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.divider }]} />
              <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                {[...todayEntries]
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .slice(0, 10)
                  .map((e, i) => (
                    <View key={i} style={styles.entryItem}>
                      <Text style={[styles.entry, { color: theme.text }]}>{e.text}</Text>
                      <Text style={[styles.entryMeta, { color: theme.textSecondary }]}>
                        {new Date(e.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} • {e.rating}/10 • {getCategoryLabel(e)}
                      </Text>
                    </View>
                  ))}
              </ScrollView>
              {todayEntries.length > 10 && (
                <Text style={[styles.moreEntriesText, { color: theme.textSecondary }]}>
                  +{todayEntries.length - 10} more entries (tap "View All Snags" to see them)
                </Text>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No entries logged today
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AllSnags', { annoyances })}
          >
            <LinearGradient
              colors={[theme.accent, theme.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.editBtnGradient}
            >
              <Ionicons name="list" size={20} color="#fff" />
              <Text style={styles.editBtnText}>View All Snags</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modern Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceSolid }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="calendar" size={24} color={theme.accent} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {monthNames[month]} {selectedDay?.day}, {year}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedDay?.entries.length > 0 ? (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {selectedDay.entries.map((e, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.modalEntry,
                      { borderBottomColor: theme.divider }
                    ]}
                  >
                    <Text style={[styles.modalEntryText, { color: theme.text }]}>{e.text}</Text>
                    <Text style={[styles.modalEntryMeta, { color: theme.textSecondary }]}>
                      {new Date(e.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} • {e.rating}/10 • {getCategoryLabel(e)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.modalEmptyContainer}>
                <Ionicons name="calendar-outline" size={64} color={theme.textTertiary} />
                <Text style={[styles.modalEmpty, { color: theme.textSecondary }]}>
                  No entries for this day
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: theme.accent }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { paddingBottom: 100 },
  blob: { position: 'absolute', borderRadius: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  arrowBtn: { 
    width: 44, 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: { alignItems: 'center' },
  monthTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    letterSpacing: -0.5,
    fontFamily: 'PoppinsBold',
  },
  yearTitle: { 
    fontSize: 14, 
    marginTop: 2, 
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },

  weekRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginVertical: 5,
    paddingHorizontal: 8,
  },
  weekDay: { 
    width: 32, 
    textAlign: 'center', 
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'PoppinsBold',
  },

  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 8, 
    marginTop: 12,
  },
  dayCell: { 
    width: '14.28%', 
    alignItems: 'center', 
    marginVertical: 6,
  },
  dayCircle: {
    width: 30, 
    height: 30,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dayText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#fff',
    fontFamily: 'PoppinsBold',
  },

  glassCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  keyCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  keyTitle: { 
    fontWeight: '700', 
    marginBottom: 10,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'PoppinsBold',
  },
  keyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  keyItem: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  keyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  keyText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },

  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  todayTitle: { 
    fontWeight: '700',
    fontSize: 20,
    flex: 1,
    fontFamily: 'PoppinsBold',
  },
  todayStats: { 
    marginBottom: 12,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  entryItem: {
    marginBottom: 12,
  },
  entry: { 
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'PoppinsSemiBold',
  },
  entryMeta: { 
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'PoppinsRegular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'PoppinsSemiBold',
  },

  editBtn: {
    borderRadius: 14,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  editBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  editBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700',
    fontFamily: 'PoppinsBold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalTitle: { 
    fontWeight: '800', 
    fontSize: 20,
    fontFamily: 'PoppinsBold',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalEntry: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalEntryText: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  modalEntryMeta: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'PoppinsRegular',
  },
  modalEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  modalEmpty: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  modalCloseBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PoppinsBold',
  },
  moreEntriesText: {
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
    fontWeight: '500',
    fontFamily: 'PoppinsRegular',
  },
});
