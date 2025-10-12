// screens/CategorySelectionScreen.js - Chip Cloud Design
import { useState, useRef, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, PanResponder, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../utils/ThemeContext';

export default function CategorySelectionScreen({ route, navigation }) {
  const { theme, mode } = useContext(ThemeContext);
  const { description, intensity } = route.params;
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [touchBlobs, setTouchBlobs] = useState([]);
  const [categories, setCategories] = useState([]);

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

        const withoutOther = defaultCategories.filter(c => c.name !== 'Other');
        const other = defaultCategories.find(c => c.name === 'Other');

        const merged = [
          ...withoutOther.map(c => ({ ...c, uid: `default-${c.id}` })),
          ...customCategories.map(c => ({ ...c, uid: `db-${c.id}` })),
          { ...other, uid: 'default-other' },
        ];

        setCategories(merged);

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

      const selectedCatObj = categories.find(c => c.uid === selectedCategory);
      const categoryLabel = selectedCatObj
        ? `${selectedCatObj.emoji || ''} ${selectedCatObj.name}`.trim()
        : "Uncategorized";

      if (user) {
        const { error } = await supabase.from('annoyances').insert([{
          user_id: user.id,
          text: description,
          rating: intensity,
          category_id: selectedCatObj ? selectedCatObj.id : null,
          created_at: new Date().toISOString(),
        }]);
        if (error) throw error;
      } else {
        const annoyance = {
          id: Date.now(),
          text: description,
          rating: intensity,
          category_id: selectedCatObj ? selectedCatObj.id : null,
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
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
      {...panResponder.panHandlers}
    >
      {/* Floating background blobs */}
      <Animated.View 
        style={[
          styles.blob,
          {
            backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})`,
            width: 130,
            height: 220,
            top: 50,
            left: -40,
            transform: [{
              translateY: blob1Float.interpolate({ inputRange: [0, 1], outputRange: [0, -25] })
            }, { rotate: '8deg' }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob,
          {
            backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})`,
            width: 100,
            height: 170,
            top: 200,
            right: -30,
            transform: [{
              translateY: blob2Float.interpolate({ inputRange: [0, 1], outputRange: [0, 18] })
            }, { rotate: '-22deg' }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob,
          {
            backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})`,
            width: 80,
            height: 140,
            bottom: 100,
            left: 20,
            transform: [{
              translateY: blob3Float.interpolate({ inputRange: [0, 1], outputRange: [0, -15] })
            }, { rotate: '35deg' }]
          }
        ]} 
      />

      {/* Touch blobs */}
      {touchBlobs.map((blob) => (
        <Animated.View
          key={blob.id}
          style={[
            styles.touchBlob,
            {
              left: blob.x,
              top: blob.y,
              opacity: blob.opacityAnim,
              backgroundColor: `rgba(255, 255, 255, ${mode === 'light' ? 0.3 : 0.2})`,
              transform: [{ scale: blob.scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) }]
            }
          ]}
        />
      ))}

      {/* Header */}
      <Animated.View style={[styles.header, {
        opacity: headerFadeAnim,
        transform: [{ translateY: headerSlideAnim }]
      }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Categorize</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary card */}
        <Animated.View style={[
          styles.summaryCard,
          { backgroundColor: theme.surface },
          {
            opacity: summaryFadeAnim,
            transform: [{ translateY: summarySlideAnim }]
          }
        ]}>
          <View style={styles.summaryHeader}>
            <Ionicons name="chatbox-ellipses" size={20} color={theme.accent} />
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Your Snag</Text>
          </View>
          <Text style={[styles.summaryDescription, { color: theme.text }]}>"{description}"</Text>
          <View style={styles.summaryRating}>
            <Text style={styles.summaryEmoji}>{getIntensityEmoji(intensity)}</Text>
            <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
              Rating: {intensity}/10
            </Text>
          </View>
        </Animated.View>

        {/* Categories - CHIP CLOUD */}
        <Animated.View style={[styles.content, { opacity: categoriesAnim }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag" size={20} color={theme.text} />
            <Text style={[styles.sectionLabel, { color: theme.text }]}>Choose Category</Text>
          </View>

          <View style={styles.chipCloud}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.uid}
                style={[
                  styles.chip,
                  { 
                    backgroundColor: selectedCategory === category.uid && category.name !== 'Other'
                      ? category.color || 'rgba(158, 158, 158, 0.8)'
                      : `${theme.surface}`,
                    borderColor: category.color || 'rgba(158, 158, 158, 0.8)',
                  },
                  selectedCategory === category.uid && category.name !== 'Other' && styles.chipSelected
                ]}
                onPress={() => {
                  if (category.name === 'Other') {
                    navigation.navigate('ManageCategories');
                  } else {
                    setSelectedCategory(category.uid);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.chipEmoji}>{category.emoji || '❓'}</Text>
                <Text style={[
                  styles.chipText,
                  { 
                    color: selectedCategory === category.uid && category.name !== 'Other' 
                      ? '#FFFFFF' 
                      : theme.text 
                  }
                ]}>
                  {category.name}
                </Text>
                {selectedCategory === category.uid && category.name !== 'Other' && (
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                )}
                {category.name === 'Other' && (
                  <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Save button */}
          <Animated.View style={{ opacity: buttonAnim, marginTop: 32 }}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.accent },
                !selectedCategory && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!selectedCategory || loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedCategory ? [theme.accent, theme.accentLight] : ['#9A9A9A', '#7A7A7A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                {loading ? (
                  <>
                    <Ionicons name="hourglass" size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>Save Snag</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blob: { 
    position: 'absolute', 
    borderRadius: 100,
  },
  touchBlob: { 
    position: 'absolute', 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    pointerEvents: 'none',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 24,
  },
  backButton: { 
    padding: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSpacer: { width: 40 },
  scrollContainer: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: 24, 
    paddingBottom: 40,
  },
  summaryCard: { 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 28, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDescription: { 
    fontSize: 16, 
    fontStyle: 'italic', 
    marginBottom: 12, 
    lineHeight: 22,
    fontWeight: '500',
  },
  summaryRating: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 8,
  },
  summaryEmoji: { fontSize: 28 },
  summaryText: { 
    fontSize: 16, 
    fontWeight: '600',
  },
  content: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionLabel: { 
    fontSize: 18, 
    fontWeight: '700',
  },

  // CHIP CLOUD STYLES
  chipCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  chipSelected: {
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    transform: [{ scale: 1.03 }],
  },
  chipEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
  },

  saveButton: { 
    borderRadius: 16, 
    overflow: 'hidden',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 12, 
    elevation: 8,
  },
  saveButtonDisabled: { 
    opacity: 0.5,
  },
  saveButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});