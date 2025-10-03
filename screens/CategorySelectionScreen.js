import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, PanResponder, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CategorySelectionScreen({ route, navigation }) {
  const { description, intensity } = route.params;
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [touchBlobs, setTouchBlobs] = useState([]);
  const [categories, setCategories] = useState([]); // dynamic categories

  // Default fallback categories
  const defaultCategories = [
    { id: 1, emoji: '👥', name: 'People', color: 'rgba(255, 107, 107, 0.8)' },
    { id: 2, emoji: '🚗', name: 'Traffic', color: 'rgba(74, 144, 226, 0.8)' },
    { id: 3, emoji: '💻', name: 'Tech', color: 'rgba(32, 201, 151, 0.8)' },
    { id: 4, emoji: '🏢', name: 'Work', color: 'rgba(247, 183, 49, 0.8)' },
    { id: 5, emoji: '🏠', name: 'Home', color: 'rgba(156, 136, 255, 0.8)' },
    { id: 6, emoji: '💰', name: 'Money', color: 'rgba(76, 209, 55, 0.8)' },
    { id: 7, emoji: '🏥', name: 'Health', color: 'rgba(255, 99, 132, 0.8)' },
    { id: 8, emoji: '📱', name: 'Social', color: 'rgba(255, 159, 64, 0.8)' },
    { id: 9, emoji: '➕', name: 'Other', color: 'rgba(158, 158, 158, 0.8)' },
  ];

  // Animation values
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const summarySlideAnim = useRef(new Animated.Value(30)).current;
  const summaryFadeAnim = useRef(new Animated.Value(0)).current;
  const categoriesAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  // Floating blob animations
  const blob1Float = useRef(new Animated.Value(0)).current;
  const blob2Float = useRef(new Animated.Value(0)).current;
  const blob3Float = useRef(new Animated.Value(0)).current;

  // Load categories dynamically
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let customCategories = [];

        if (user) {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;
          customCategories = data || [];
        } else {
          const stored = await AsyncStorage.getItem('guest_categories');
          customCategories = stored ? JSON.parse(stored) : [];
        }

        // merge defaults and custom, always put Other last
        const withoutOther = defaultCategories.filter(c => c.name !== 'Other');
        const other = defaultCategories.find(c => c.name === 'Other');

        const merged = [
          ...withoutOther.map(c => ({ ...c, uid: `default-${c.id}` })),
          ...customCategories.map(c => ({ ...c, uid: `db-${c.id}` })),
          { ...other, uid: 'default-other' },
        ];

        setCategories(merged);

        // ✅ ensure selectedCategory is still valid
        if (selectedCategory && !merged.find(c => c.uid === selectedCategory)) {
          setSelectedCategory(null);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
        setCategories(defaultCategories.map(c => ({ ...c, uid: `default-${c.id}` })));
      }
    };

    const unsubscribe = navigation.addListener('focus', loadCategories);
    return unsubscribe;
  }, [navigation, selectedCategory]);

  const createTouchBlob = (x, y) => {
    const id = Date.now() + Math.random();
    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(0.8);

    const newBlob = {
      id,
      x: x - 25,
      y: y - 25,
      scaleAnim,
      opacityAnim,
    };

    setTouchBlobs(prev => [...prev, newBlob]);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTouchBlobs(prev => prev.filter(blob => blob.id !== id));
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      createTouchBlob(locationX, locationY);
    },
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(summarySlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(summaryFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    setTimeout(() => {
      Animated.timing(categoriesAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 600);

    setTimeout(() => {
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 800);

    const createFloatingAnimation = (animValue) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 4500,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 4500,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatingAnimation(blob1Float).start();
    createFloatingAnimation(blob2Float).start();
    createFloatingAnimation(blob3Float).start();
  }, []);

  const getIntensityEmoji = (value) => {
    if (value <= 2) return '😐';
    if (value <= 4) return '😒';
    if (value <= 6) return '😤';
    if (value <= 8) return '😡';
    return '🤬';
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert('Hold on!', 'Please select a category');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // ✅ get full category object
      const selectedCatObj = categories.find(c => c.uid === selectedCategory);
      const categoryLabel = selectedCatObj
        ? `${selectedCatObj.emoji || ''} ${selectedCatObj.name}`.trim()
        : "Uncategorized";

      if (user) {
        const { error } = await supabase.from('annoyances').insert([{
          user_id: user.id,
          text: description,
          rating: intensity,
          // only DB categories get a real category_id
          category_id: selectedCatObj ? selectedCatObj.id : null,
          created_at: new Date().toISOString(),
        }]);
        if (error) throw error;
      } else {
        const annoyance = {
          id: Date.now(),
          text: description,
          rating: intensity,
          category_id: selectedCategory,   // this will now be a uid
          category_label: categoryLabel,
          created_at: new Date().toISOString(),
        };

        const stored = await AsyncStorage.getItem('guest_annoyances');
        const annoyances = stored ? JSON.parse(stored) : [];
        annoyances.push(annoyance);

        await AsyncStorage.setItem('guest_annoyances', JSON.stringify(annoyances));
      }

      Alert.alert('Success!', 'Annoyance logged successfully', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }) },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#E8D5FF', '#D1BAF5', '#B79CED']}
      locations={[0, 0.5, 1]}
      style={styles.container}
      {...panResponder.panHandlers}
    >
      {/* Floating background blobs */}
      <Animated.View style={[styles.blob, styles.blob1, {
        transform: [{
          translateY: blob1Float.interpolate({ inputRange: [0, 1], outputRange: [0, -25] })
        }, { rotate: '8deg' }]
      }]} />
      <Animated.View style={[styles.blob, styles.blob2, {
        transform: [{
          translateY: blob2Float.interpolate({ inputRange: [0, 1], outputRange: [0, 18] })
        }, { rotate: '-22deg' }]
      }]} />
      <Animated.View style={[styles.blob, styles.blob3, {
        transform: [{
          translateY: blob3Float.interpolate({ inputRange: [0, 1], outputRange: [0, -15] })
        }, { rotate: '35deg' }]
      }]} />

      {/* Touch blobs */}
      {touchBlobs.map((blob) => (
        <Animated.View
          key={blob.id}
          style={[styles.touchBlob, {
            left: blob.x,
            top: blob.y,
            opacity: blob.opacityAnim,
            transform: [{ scale: blob.scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) }]
          }]}
        />
      ))}

      {/* Header */}
      <Animated.View style={[styles.header, {
        opacity: headerFadeAnim,
        transform: [{ translateY: headerSlideAnim }]
      }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categorize</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Summary card */}
        <Animated.View style={[styles.summaryCard, {
          opacity: summaryFadeAnim,
          transform: [{ translateY: summarySlideAnim }]
        }]}>
          <Text style={styles.summaryDescription}>"{description}"</Text>
          <View style={styles.summaryRating}>
            <Text style={styles.summaryEmoji}>{getIntensityEmoji(intensity)}</Text>
            <Text style={styles.summaryText}>Rating: {intensity}/10</Text>
          </View>
        </Animated.View>

        {/* Categories */}
        <Animated.View style={[styles.content, { opacity: categoriesAnim }]}>
          <Text style={styles.sectionLabel}>What category?</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.uid}
                style={[
                  styles.categoryButton,
                  { backgroundColor: category.color || 'rgba(158, 158, 158, 0.8)' },
                  selectedCategory === category.uid && category.name !== 'Other' && styles.categoryButtonSelected
                ]}
                onPress={() => {
                  if (category.name === 'Other') {
                    navigation.navigate('ManageCategories');
                  } else {
                    setSelectedCategory(category.uid);
                  }
                }}
              >
                <Text style={styles.categoryEmoji}>{category.emoji || '❓'}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                {selectedCategory === category.uid && category.name !== 'Other' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedCategory && categories.find(c => c.uid === selectedCategory)?.name !== 'Other' && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedText}>
                Selected: {categories.find(c => c.uid === selectedCategory)?.name} ✓
              </Text>
            </View>
          )}


          {/* Save button */}
          <Animated.View style={{ opacity: buttonAnim }}>
            <TouchableOpacity
              style={[styles.saveButton, !selectedCategory && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!selectedCategory || loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Annoyance'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blob: { position: 'absolute', backgroundColor: 'rgba(255, 255, 255, 0.25)', borderRadius: 100 },
  blob1: { width: 130, height: 220, top: 50, left: -40 },
  blob2: { width: 100, height: 170, top: 200, right: -30 },
  blob3: { width: 80, height: 140, bottom: 100, left: 20 },
  touchBlob: { position: 'absolute', width: 50, height: 50, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 25, pointerEvents: 'none' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, fontWeight: '500', color: '#4A4A4A' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#4A4A4A', letterSpacing: 0.3 },
  headerSpacer: { width: 60 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  summaryCard: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 20, padding: 20, marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  summaryDescription: { fontSize: 16, color: '#4A4A4A', fontStyle: 'italic', marginBottom: 12, lineHeight: 22 },
  summaryRating: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryEmoji: { fontSize: 24 },
  summaryText: { fontSize: 16, color: '#6A6A6A', fontWeight: '500' },
  content: { flex: 1 },
  sectionLabel: { fontSize: 18, fontWeight: '600', color: '#4A4A4A', marginBottom: 16 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  categoryButton: { width: '30%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3, position: 'relative' },
  categoryButtonSelected: { borderWidth: 3, borderColor: '#FFFFFF', transform: [{ scale: 1.05 }] },
  categoryEmoji: { fontSize: 32, marginBottom: 8 },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  checkmark: { position: 'absolute', top: 4, right: 4, backgroundColor: '#FFFFFF', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  checkmarkText: { fontSize: 14, fontWeight: 'bold', color: '#4A4A4A' },
  selectedIndicator: { backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 16, borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  selectedText: { fontSize: 16, fontWeight: '600', color: '#4A4A4A', textAlign: 'center' },
  saveButton: { backgroundColor: '#2D2D2D', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  saveButtonDisabled: { backgroundColor: '#9A9A9A' },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 },
});
