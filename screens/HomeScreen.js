import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../utils/ThemeContext';
import { Ionicons } from '@expo/vector-icons';





export default function HomeScreen({ navigation }) {
  const { theme, mode } = useContext(ThemeContext);
  const [touchBlobs, setTouchBlobs] = useState([]);
  const [annoyances, setAnnoyances] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [streaks, setStreaks] = useState({ current: 0, best: 0 });
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  const headerSlideAnim = useRef(new Animated.Value(-50)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(30)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const mainButtonAnim = useRef(new Animated.Value(0)).current;

  const blob1Float = useRef(new Animated.Value(0)).current;
  const blob2Float = useRef(new Animated.Value(0)).current;
  const blob3Float = useRef(new Animated.Value(0)).current;

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
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

          // Calculate streaks
          if (loaded.length > 0) {
            const days = [...new Set(loaded.map(e => new Date(e.created_at).toDateString()))]
              .sort((a, b) => new Date(a) - new Date(b));

            let current = 1;
            let best = 1;

            for (let i = 1; i < days.length; i++) {
              const diffDays = (new Date(days[i]) - new Date(days[i - 1])) / 86400000;
              if (diffDays <= 1.1) {
                current++;
              } else {
                best = Math.max(best, current);
                current = 1;
              }
            }
            best = Math.max(best, current);

            // ✅ If last log isn't from today, streak resets
            const lastLogDate = new Date(days[days.length - 1]);
            const today = new Date();
            const diffFromToday = (today - lastLogDate) / 86400000;
            if (diffFromToday > 1.1) current = 0;

            setStreaks({ current, best });

            // ✅ Handle AsyncStorage tracking
            const lastKnownStreak = await AsyncStorage.getItem('last_known_streak');
            const previousStreak = lastKnownStreak ? parseInt(lastKnownStreak) : 0;

            if (current > previousStreak && current > 1) {
              setShowStreakCelebration(true);
              triggerStreakCelebration();
              await AsyncStorage.setItem('last_known_streak', current.toString());
            } else if (current === 0) {
              await AsyncStorage.setItem('last_known_streak', '0');
            } else if (current === 1 && previousStreak === 0) {
              await AsyncStorage.setItem('last_known_streak', '1');
            }
          } else {
            // No entries at all → reset streaks
            setStreaks({ current: 0, best: 0 });
            await AsyncStorage.setItem('last_known_streak', '0');
          }

        } catch (err) {
          console.log('Error loading annoyances:', err.message);
        }
      };

      loadAnnoyances();
    }, [])
  );

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

  const triggerStreakCelebration = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(celebrationScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2000),
      Animated.parallel([
        Animated.timing(celebrationScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setShowStreakCelebration(false);
      celebrationScale.setValue(0);
      celebrationOpacity.setValue(0);
    });
  };

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

    setTimeout(() => {
      Animated.timing(mainButtonAnim, {
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

  const getMoodEmoji = (count) => {
    if (count === 0) return '😌';
    if (count <= 2) return '🙂';
    if (count <= 4) return '😐';
    if (count <= 6) return '😤';
    return '🤬';
  };

  const getMoodText = (count) => {
    if (count === 0) return 'Peaceful day';
    if (count <= 2) return 'Pretty smooth';
    if (count <= 4) return 'Getting annoyed';
    if (count <= 6) return 'Rough day';
    return 'Very frustrating';
  };

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
      {...panResponder.panHandlers}
    >
      <Animated.View 
        style={[
          styles.blob,
          {
            backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})`,
            width: 130,
            height: 220,
            top: 50,
            left: -40,
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
          {
            backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})`,
            width: 100,
            height: 170,
            top: 200,
            right: -30,
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
          {
            backgroundColor: `rgba(255, 255, 255, ${theme.blobOpacity})`,
            width: 80,
            height: 140,
            bottom: 100,
            left: 20,
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

      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</Text>
            <Text style={[styles.appName, { color: theme.accent }]}>The Snag Log</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={24} color={theme.text} />
            </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            {
              opacity: contentFadeAnim,
              transform: [{ translateY: contentSlideAnim }]
            }
          ]}
        >
          {/* Today's Overview Card */}
          <View style={[styles.todayCard, { 
            backgroundColor: theme.surface,
            borderColor: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'
          }]}>
            <View style={styles.todayLeft}>
              <Text style={styles.todayEmoji}>{getMoodEmoji(todayCount)}</Text>
              <View style={styles.todayInfo}>
                <Text style={[styles.todayStatus, { color: theme.text }]}>{getMoodText(todayCount)}</Text>
                <Text style={[styles.todayDate, { color: theme.textSecondary }]}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                {streaks.current > 0 && (
                  <View style={[styles.streakChip, { 
                    backgroundColor: mode === 'light' ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255, 107, 53, 0.3)',
                    borderColor: theme.accent
                  }]}>
                    <Text style={styles.streakChipText}>🔥 {streaks.current} day streak</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={[styles.todayRight, { backgroundColor: theme.accent }]}>
              <Text style={styles.todayCount}>{todayCount}</Text>
              <Text style={styles.todayLabel}>logged</Text>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={[styles.recentSection, { 
            backgroundColor: theme.surface,
            borderColor: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'
          }]}>
            <View style={styles.recentHeader}>
              <Text style={[styles.recentTitle, { color: theme.text }]}>Recent Activity</Text>
              {annoyances.length > 3 && (
                <TouchableOpacity onPress={() => navigation.navigate('AllSnags', { annoyances })}>
                  <Text style={[styles.viewAllBtn, { color: theme.accent }]}>View All →</Text>
                </TouchableOpacity>
              )}
            </View>

            {annoyances.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No snags yet</Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Start tracking to discover your patterns</Text>
              </View>
            ) : (
              annoyances.slice(0, 3).map((item, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: theme.accent }]} />
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityText, { color: theme.text }]} numberOfLines={2}>{item.text.replace(/\n/g, ' ')}</Text>
                    <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.rating}/10
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Main Action Button - Glowing Pill */}
          <Animated.View style={{ opacity: mainButtonAnim }}>
            <TouchableOpacity 
              style={styles.glowButton}
              onPress={() => navigation.navigate('LogAnnoyance')}
              activeOpacity={0.8}
            >
              <View style={[styles.glowOuter, { 
                backgroundColor: theme.accent,
                shadowColor: theme.accent
              }]}>
                <View style={styles.glowInner}>
                  <Text style={styles.glowButtonText}>+ Create</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Text style={[styles.footerTip, { color: theme.textSecondary }]}>💡 Track daily to reveal patterns and reduce stress</Text>
        </Animated.View>
      </ScrollView>

      {/* Streak Celebration Overlay */}
      {showStreakCelebration && (
        <Animated.View 
          style={[
            styles.celebrationOverlay,
            {
              opacity: celebrationOpacity,
              transform: [{ scale: celebrationScale }],
            }
          ]}
        >
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationEmoji}>🔥</Text>
            <Text style={styles.celebrationText}>{streaks.current} Day Streak!</Text>
            <Text style={styles.celebrationSubtext}>Keep it going!</Text>
          </View>
        </Animated.View>
      )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    pointerEvents: 'none',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    paddingRight: 36,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'PoppinsRegular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'PoppinsBold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: { fontSize: 20 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

  todayCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  todayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todayEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  todayInfo: {
    flex: 1,
  },
  todayStatus: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 2,
  },
  todayDate: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    marginBottom: 6,
  },
  streakChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakChipText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'PoppinsSemiBold',
    color: '#fff',
  },
  todayRight: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  todayCount: {
    fontSize: 25,
    fontWeight: '800',
    fontFamily: 'PoppinsBold',
    color: '#fff',
    lineHeight: 32,
  },
  todayLabel: {
    fontSize: 10,
    fontFamily: 'PoppinsRegular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '600',
  },

  recentSection: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'PoppinsSemiBold',
  },
  viewAllBtn: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: { flex: 1 },
  activityText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'PoppinsRegular',
    marginBottom: 4,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
  },

  glowButton: {
    marginBottom: 16,
    alignItems: 'center',
  },
  glowOuter: {
    borderRadius: 30,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  glowInner: {
    paddingVertical: 16,
    paddingHorizontal: 60,
  },
  glowButtonText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'PoppinsBold',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  footerTip: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
  },
  celebrationCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  celebrationEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  celebrationText: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'PoppinsBold',
    color: '#fff',
    marginBottom: 8,
  },
  celebrationSubtext: {
    fontSize: 16,
    fontFamily: 'PoppinsRegular',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
});
