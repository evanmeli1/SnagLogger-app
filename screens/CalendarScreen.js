// screens/CalendarScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export default function CalendarScreen({ navigation }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [annoyances, setAnnoyances] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null); 
  const [modalVisible, setModalVisible] = useState(false);

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
    const match = defaultCategories.find((c) => c.id === entry.category_id);
    if (match) return `${match.emoji} ${match.name}`;
    return "Uncategorized";
  };

  useFocusEffect(
    useCallback(() => {
      const loadAnnoyances = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          let loaded = [];

          if (user) {
            const { data, error } = await supabase
              .from('annoyances')
              .select('*')
              .order('created_at', { ascending: false });
            if (error) throw error;
            loaded = data || [];
          } else {
            const stored = await AsyncStorage.getItem('guest_annoyances');
            loaded = stored ? JSON.parse(stored) : [];
          }

          setAnnoyances(loaded);
        } catch (err) {
          console.log('Error loading annoyances:', err.message);
        }
      };

      loadAnnoyances();
    }, [])
  );

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
    if (entries.length === 0) return '#ccc'; 
    if (entries.length <= 3) return 'green'; 
    if (entries.length <= 6) return 'gold'; 
    return 'red'; 
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
      colors={['#667eea', '#764ba2', '#f093fb']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.arrowBtn} onPress={goToPrevMonth}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.monthTitle}>{monthNames[month]}</Text>
            <Text style={styles.yearTitle}>{year}</Text>
          </View>
          <TouchableOpacity style={styles.arrowBtn} onPress={goToNextMonth}>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Days of week */}
        <View style={styles.weekRow}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <Text key={i} style={styles.weekDay}>{d}</Text>
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
                  isToday && styles.todayBorder
                ]}>
                  <Text style={styles.dayText}>{day}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Key - Compact */}
        <View style={styles.keyCard}>
          <Text style={styles.keyTitle}>Key</Text>
          <View style={styles.keyGrid}>
            <View style={styles.keyItem}>
              <View style={[styles.keyDot, { backgroundColor: 'green' }]} />
              <Text style={styles.keyText}>1–3</Text>
            </View>
            <View style={styles.keyItem}>
              <View style={[styles.keyDot, { backgroundColor: 'gold' }]} />
              <Text style={styles.keyText}>4–6</Text>
            </View>
            <View style={styles.keyItem}>
              <View style={[styles.keyDot, { backgroundColor: 'red' }]} />
              <Text style={styles.keyText}>7+</Text>
            </View>
            <View style={styles.keyItem}>
              <View style={[styles.keyDot, { backgroundColor: '#ccc' }]} />
              <Text style={styles.keyText}>None</Text>
            </View>
          </View>
        </View>

        {/* Today summary - Glassmorphism */}
        <View style={styles.glassCard}>
          <Text style={styles.todayTitle}>
            Today, {monthNames[today.getMonth()]} {today.getDate()}
          </Text>
          <Text style={styles.todayStats}>
            {todayEntries.length} logged • Avg {avg}/10
          </Text>

          {todayEntries.length > 0 ? (
            <>
              <View style={styles.divider} />
              {[...todayEntries]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((e, i) => (
                  <View key={i} style={styles.entryItem}>
                    <Text style={styles.entry}>{e.text}</Text>
                    <Text style={styles.entryMeta}>
                      {new Date(e.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} • {e.rating}/10 • {getCategoryLabel(e)}
                    </Text>
                  </View>
                ))}
            </>
          ) : (
            <Text style={styles.emptyText}>No entries logged today</Text>
          )}

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AllSnags', { annoyances })}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6A0DAD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.editBtnGradient}
            >
              <Text style={styles.editBtnText}>Edit Entries</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modern Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {monthNames[month]} {selectedDay?.day}, {year}
            </Text>

            {selectedDay?.entries.length > 0 ? (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {selectedDay.entries.map((e, i) => (
                  <View key={i} style={styles.modalEntry}>
                    <Text style={styles.modalEntryText}>{e.text}</Text>
                    <Text style={styles.modalEntryMeta}>
                      {new Date(e.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} • {e.rating}/10 • {getCategoryLabel(e)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.modalEmpty}>No entries for this day</Text>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
  },
  arrow: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerCenter: { alignItems: 'center' },
  monthTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  yearTitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 },

  weekRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  weekDay: { 
    width: 32, 
    textAlign: 'center', 
    fontWeight: '700', 
    color: '#fff',
    fontSize: 15,
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
    width: 32, 
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  todayBorder: {
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  dayText: { fontSize: 13, fontWeight: '500', color: '#fff' },

  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  keyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  keyTitle: { 
    fontWeight: '600', 
    marginBottom: 10, 
    color: '#fff',
    fontSize: 14,
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
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  todayTitle: { 
    fontWeight: '700', 
    marginBottom: 6, 
    color: '#fff',
    fontSize: 20,
  },
  todayStats: { 
    marginBottom: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 16,
  },
  entriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  entriesIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entriesIcon: {
    fontSize: 16,
  },
  entriesHeaderText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  entryItem: {
    marginBottom: 12,
  },
  entry: { 
    fontSize: 15, 
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  entryMeta: { 
    fontSize: 13, 
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    marginVertical: 12,
    fontStyle: 'italic',
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
    paddingVertical: 14,
  },
  editBtnIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  editBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { 
    fontWeight: '700', 
    fontSize: 20, 
    marginBottom: 16,
    color: '#333',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalEntry: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalEntryText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  modalEntryMeta: {
    fontSize: 13,
    color: '#666',
  },
  modalEmpty: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 32,
    fontSize: 15,
  },
  modalCloseBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});