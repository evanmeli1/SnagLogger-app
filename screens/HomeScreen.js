import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';



export default function HomeScreen({ navigation }) {
  const [touchBlobs, setTouchBlobs] = useState([]);
  const [annoyances, setAnnoyances] = useState([]);
  const [todayCount, setTodayCount] = useState(0);

  
  // Animation values
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(30)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const categoriesAnim = useRef(new Animated.Value(0)).current;
  const mainButtonAnim = useRef(new Animated.Value(0)).current;

  // Floating blob animations
  const blob1Float = useRef(new Animated.Value(0)).current;
  const blob2Float = useRef(new Animated.Value(0)).current;
  const blob3Float = useRef(new Animated.Value(0)).current;

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Load annoyances (Supabase if logged in, AsyncStorage if guest)
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

          loaded = loaded.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          setAnnoyances(loaded);

          const todayDate = new Date().toDateString();
          const count = loaded.filter(item => {
            const itemDate = new Date(item.created_at).toDateString();
            return itemDate === todayDate;
          }).length;

          setTodayCount(count);
        } catch (err) {
          console.log('Error loading annoyances:', err.message);
        }
      };

      loadAnnoyances();
    }, [])
  );



  // Touch blob creation (same as welcome screen)
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

  // Pan responder for touch detection
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      createTouchBlob(locationX, locationY);
    },
  });

  useEffect(() => {
    // Header animation
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

    // Content animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Staggered animations
    setTimeout(() => {
      Animated.timing(categoriesAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 600);

    setTimeout(() => {
      Animated.timing(mainButtonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 800);

    // Floating blob animations
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

  const animatedButtonPress = (callback) => {
    const scaleAnim = new Animated.Value(1);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  const categoryData = [
    { emoji: '👥', text: 'People', color: 'rgba(255, 107, 107, 0.8)' },
    { emoji: '🚗', text: 'Traffic', color: 'rgba(74, 144, 226, 0.8)' },
    { emoji: '💻', text: 'Tech', color: 'rgba(32, 201, 151, 0.8)' },
    { emoji: '🏢', text: 'Work', color: 'rgba(247, 183, 49, 0.8)' },
  ];

  return (
    <LinearGradient
      colors={['#E8D5FF', '#D1BAF5', '#B79CED']}
      locations={[0, 0.5, 1]}
      style={styles.container}
      {...panResponder.panHandlers}
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
              { rotate: '8deg' }
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
                  outputRange: [0, 18],
                })
              },
              { rotate: '-22deg' }
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
                  outputRange: [0, -15],
                })
              },
              { rotate: '35deg' }
            ]
          }
        ]} 
      />

      {/* Touch-responsive blobs */}
      {touchBlobs.map((blob) => (
        <Animated.View
          key={blob.id}
          style={[
            styles.touchBlob,
            {
              left: blob.x,
              top: blob.y,
              opacity: blob.opacityAnim,
              transform: [
                {
                  scale: blob.scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 2],
                  })
                }
              ]
            }
          ]}
        />
      ))}

      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }]
          }
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appName}>The Snag Log</Text>
            <Text style={styles.headerSubtitle}>Track • Reflect • Improve</Text>
          </View>

          {/* Settings Button */}
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>


      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: contentFadeAnim,
              transform: [{ translateY: contentSlideAnim }]
            }
          ]}
        >
          <View style={styles.dateCard}>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.count}>📊 Logged: {todayCount} snags today</Text>
          </View>

          <View style={styles.recentCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>📝 Recent Snags</Text>

              {annoyances.length > 3 && (
                <TouchableOpacity onPress={() => navigation.navigate('AllSnags', { annoyances })}>
                  <Text style={{ color: '#6A0DAD', fontWeight: '600' }}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {annoyances.length === 0 ? (
              <>
                <Text style={styles.emptyText}>No snags logged yet today</Text>
                <Text style={styles.motivationalText}>
                  Start tracking to discover your patterns! ✨
                </Text>
              </>
            ) : (
              annoyances.slice(0, 3).map((item, index) => (
                <View key={index} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, color: '#333' }}>• {item.text}</Text>
                  <Text style={{ fontSize: 12, color: '#999' }}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))
            )}
          </View>



          <Animated.View style={{ opacity: categoriesAnim }}>
            <Text style={styles.sectionTitle}>Quick Categories</Text>
            <View style={styles.categoryGrid}>
              {categoryData.map((category, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.categoryButton, { backgroundColor: category.color }]}
                  onPress={() => animatedButtonPress(() => {
                    // Navigate to log screen with pre-selected category
                  })}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={styles.categoryText}>{category.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: mainButtonAnim }}>
            <TouchableOpacity 
              style={styles.mainButton}
              onPress={() => animatedButtonPress(() => {
              navigation.navigate('LogAnnoyance');
              })}
            >
              <Text style={styles.mainButtonEmoji}>😤</Text>
              <Text style={styles.mainButtonText}>What's bugging you today?</Text>
              <Text style={styles.mainButtonSubtext}>TAP TO LOG A SNAG</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.tip}>💡 Daily tracking reveals patterns and helps reduce future frustrations</Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 100,
  },
  blob1: {
    width: 130,
    height: 220,
    top: 50,
    left: -40,
  },
  blob2: {
    width: 100,
    height: 170,
    top: 200,
    right: -30,
  },
  blob3: {
    width: 80,
    height: 140,
    bottom: 100,
    left: 20,
  },
  touchBlob: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    pointerEvents: 'none',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
    settingsIcon: {
      fontSize: 22,
  },

  appName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#4A4A4A',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6A6A6A',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '400',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
  },
  dateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  date: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 8,
  },
  count: {
    fontSize: 16,
    color: '#6A6A6A',
    fontWeight: '400',
  },
  recentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 12,
  },
  emptyText: {
    color: '#9A9A9A',
    fontStyle: 'italic',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  motivationalText: {
    color: '#6A6A6A',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryButton: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainButton: {
    backgroundColor: '#2D2D2D',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  mainButtonEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  mainButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tip: {
    textAlign: 'center',
    color: '#6A6A6A',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});