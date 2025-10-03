// screens/ManageCategoriesScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';

export default function ManageCategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newColor, setNewColor] = useState('#6A0DAD');
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  // Floating blob animations
  const blob1Float = useRef(new Animated.Value(0)).current;
  const blob2Float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatAnim = (animValue, up, down) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: up, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: down, useNativeDriver: true }),
        ])
      ).start();
    floatAnim(blob1Float, 4000, 4000);
    floatAnim(blob2Float, 5000, 5000);
  }, []);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id);
        if (error) throw error;
        setCategories(data || []);
      } else {
        const stored = await AsyncStorage.getItem('guest_categories');
        setCategories(stored ? JSON.parse(stored) : []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // Convert slider value to color
  const getColorFromValue = (val) => {
    const colors = [
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 255, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 255, b: 255 },
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 0, b: 255 },
      { r: 255, g: 0, b: 0 },
    ];
    const scaled = val * (colors.length - 1);
    const idx = Math.floor(scaled);
    const t = scaled - idx;
    if (idx >= colors.length - 1) {
      return `rgb(${colors[colors.length - 1].r},${colors[colors.length - 1].g},${colors[colors.length - 1].b})`;
    }

    const c1 = colors[idx];
    const c2 = colors[idx + 1];

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgb(${r},${g},${b})`;
  };

  const handleSaveCategory = async () => {
    if (!newName.trim()) {
      Alert.alert('Oops!', 'Please enter a name.');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editCategory) {
        // --- Update existing category ---
        if (user) {
          await supabase
            .from('categories')
            .update({ name: newName.trim(), emoji: newEmoji || '❓', color: newColor })
            .eq('id', editCategory.id)
            .eq('user_id', user.id);
        } else {
          let arr = categories.map((c) =>
            c.id === editCategory.id
              ? { ...c, name: newName.trim(), emoji: newEmoji || '❓', color: newColor }
              : c
          );
          setCategories(arr);
          await AsyncStorage.setItem('guest_categories', JSON.stringify(arr));
        }
      } else {
        // --- Add new category ---
        const limit = isPro ? 20 : 1;
        if (categories.length >= limit) {
          Alert.alert(
            'Limit reached',
            isPro
              ? 'You can only have up to 20 custom categories.'
              : 'Free users can only create 1 custom category. Upgrade to Pro for more!'
          );
          setLoading(false);
          return;
        }

        if (user) {
          await supabase.from('categories').insert([
            { user_id: user.id, name: newName.trim(), emoji: newEmoji || '❓', color: newColor },
          ]);
        } else {
          const newCategory = {
            id: Date.now(),
            name: newName.trim(),
            emoji: newEmoji || '❓',
            color: newColor,
          };
          const arr = [...categories, newCategory];
          setCategories(arr);
          await AsyncStorage.setItem('guest_categories', JSON.stringify(arr));
        }
      }

      setNewName('');
      setNewEmoji('');
      setNewColor('#6A0DAD');
      setEditCategory(null);
      setModalVisible(false);
      loadCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      Alert.alert('Error', 'Could not save category.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
      } else {
        let arr = categories.filter((c) => c.id !== id);
        setCategories(arr);
        await AsyncStorage.setItem('guest_categories', JSON.stringify(arr));
      }
      loadCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: item.color || '#aaa' }]}
      onPress={() => {
        setEditCategory(item);
        setNewName(item.name);
        setNewEmoji(item.emoji || '');
        setNewColor(item.color || '#6A0DAD');
        setModalVisible(true);
      }}
      onLongPress={() =>
        Alert.alert('Delete Category', `Delete "${item.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) },
        ])
      }
    >
      <Text style={styles.emoji}>{item.emoji || '❓'}</Text>
      <Text style={styles.name}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#6A0DAD', '#3A0CA3']} style={styles.container}>
      {/* Floating blobs */}
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          { transform: [{ translateY: blob1Float.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          { transform: [{ translateY: blob2Float.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] },
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Categories</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Categories list */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={renderCategory}
      />

      {/* Add button at bottom */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          setEditCategory(null);
          setNewName('');
          setNewEmoji('');
          setNewColor('#6A0DAD');
          setModalVisible(true);
        }}
      >
        <Text style={styles.addText}>➕ Add Category</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editCategory ? 'Edit Category' : 'Create Category'}
            </Text>
            <TextInput
              placeholder="Category name"
              style={styles.input}
              value={newName}
              onChangeText={(text) => {
                if (text.length <= 20) setNewName(text);
              }}
              maxLength={20}
              placeholderTextColor="#aaa"
            />
            <TextInput
              placeholder="Emoji (optional)"
              style={styles.input}
              value={newEmoji}
              onChangeText={(text) => {
                if (text.length <= 5) setNewEmoji(text);
              }}
              maxLength={5}
              placeholderTextColor="#aaa"
            />

            {/* ✅ Color slider */}
            <View style={{ width: '100%', marginVertical: 12 }}>
              <Text style={{ color: '#fff', marginBottom: 8 }}>Pick a color</Text>
              <View style={{ height: 30, borderRadius: 8, overflow: 'hidden', justifyContent: 'center' }}>
                <LinearGradient
                  colors={['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ ...StyleSheet.absoluteFillObject }}
                />
                <Slider
                  style={{ width: '100%', height: 30 }}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.01}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor={newColor}
                  onValueChange={(val) => setNewColor(getColorFromValue(val))}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCategory} disabled={loading}>
              <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blob: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 100 },
  blob1: { width: 120, height: 200, top: 50, left: -30 },
  blob2: { width: 100, height: 180, bottom: 100, right: -20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 },
  back: { fontSize: 16, fontWeight: '500', color: '#fff' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  grid: { paddingHorizontal: 16, paddingBottom: 20 },
  categoryCard: { flex: 1, margin: 8, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  emoji: { fontSize: 28, marginBottom: 8 },
  name: { fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' },
  addBtn: { marginHorizontal: 24, marginBottom: 40, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  addText: { fontSize: 16, fontWeight: '700', color: '#6A0DAD' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: 'rgba(20,20,40,0.95)', borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#fff' },
  input: { width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 16, backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' },
  saveBtn: { backgroundColor: '#6A0DAD', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, marginTop: 4, width: '100%', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
  cancel: { color: '#aaa', fontWeight: '600', marginTop: 10 },
});
