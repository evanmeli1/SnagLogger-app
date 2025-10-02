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

  // 🔑 Default categories
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

  // Helper for category label
  const getCategoryLabel = (entry) => {
    if (!entry) return "Uncategorized";
    if (entry.category_label) return entry.category_label;
    const match = defaultCategories.find((c) => c.id === entry.category_id);
    if (match) return `${match.emoji} ${match.name}`;
    return "Uncategorized";
  };

  // Fetch annoyances (Supabase or guest storage)
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
              .order('created_at', { ascending: false }); // newest first
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

  // Helpers
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Group annoyances by day
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

  // Today’s data
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const todayEntries = grouped[todayKey] || [];
  const avg =
    todayEntries.length > 0
      ? (todayEntries.reduce((s, e) => s + (e.rating || 0), 0) /
          todayEntries.length).toFixed(1)
      : 0;

  // Month navigation
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

  // Handle day press
  const handleDayPress = (day) => {
    const key = `${year}-${month}-${day}`;
    const entries = [...(grouped[key] || [])].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    ); // newest first
    setSelectedDay({ key, day, entries });
    setModalVisible(true);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.arrowBtn} onPress={goToPrevMonth}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {monthNames[month]} {year}
          </Text>
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
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <TouchableOpacity key={day} style={styles.dayCell} onPress={() => handleDayPress(day)}>
              <View style={[styles.dayCircle, { backgroundColor: getColor(day) }]}>
                <Text style={styles.dayText}>{day}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend:</Text>
          <Text style={styles.legendItem}>🟢 Good day (1–3 annoyances)</Text>
          <Text style={styles.legendItem}>🟡 Rough day (4–6 annoyances)</Text>
          <Text style={styles.legendItem}>🔴 Awful day (7+ annoyances)</Text>
          <Text style={styles.legendItem}>⚪ No entries</Text>
        </View>

        {/* Today summary */}
        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>
            ─── Today ({monthNames[today.getMonth()]} {today.getDate()}) ───
          </Text>
          <Text style={styles.todayStats}>
            📊 {todayEntries.length} annoyances • Average: {avg}
          </Text>

          {todayEntries.length > 0 ? (
            <>
              <Text style={styles.todayEntriesTitle}>📝 Today's Entries:</Text>
              {[...todayEntries]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((e, i) => (
                  <View key={i}>
                    <Text style={styles.entry}>• {e.text} ({e.rating}/10)</Text>
                    <Text style={styles.entryMeta}>
                      {new Date(e.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {getCategoryLabel(e)}
                    </Text>
                  </View>
                ))}
            </>
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 8 }}>
              No entries logged today.
            </Text>
          )}

          {/* Edit Entries navigates to AllSnags */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AllSnags', { annoyances })}
          >
            <Text style={styles.editBtnText}>✏️ Edit Entries</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Day modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Entries for {monthNames[month]} {selectedDay?.day}
            </Text>

            {selectedDay?.entries.length > 0 ? (
              selectedDay.entries.map((e, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <Text>• {e.text} ({e.rating}/10)</Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>
                    {new Date(e.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • {getCategoryLabel(e)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: 'center', marginVertical: 20 }}>
                No entries for this day.
              </Text>
            )}

            <TouchableOpacity
              style={[styles.editBtn, { marginTop: 20 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.editBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 20,
  },
  arrowBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  arrow: { fontSize: 22, fontWeight: '700', color: '#333' },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#333' },

  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },
  weekDay: { width: 32, textAlign: 'center', fontWeight: '600', color: '#444' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginTop: 12 },
  dayCell: { width: '14.28%', alignItems: 'center', marginVertical: 6 },
  dayCircle: {
    width: 32, height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: { fontSize: 13, fontWeight: '500', color: '#fff' },

  legend: { padding: 16, borderTopWidth: 1, borderColor: '#ddd', marginTop: 20 },
  legendTitle: { fontWeight: '700', marginBottom: 8 },
  legendItem: { marginBottom: 6 },

  todayCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginTop: 24,
  },
  todayTitle: { textAlign: 'center', fontWeight: '700', marginBottom: 6 },
  todayStats: { textAlign: 'center', marginBottom: 12 },
  todayEntriesTitle: { fontWeight: '600', marginBottom: 6 },
  entry: { fontSize: 14 },
  entryMeta: { fontSize: 12, color: '#666', marginBottom: 6 },

  editBtn: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  editBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

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
  modalTitle: { fontWeight: '700', fontSize: 16, marginBottom: 12 },
});
