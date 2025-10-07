// screens/AnalyticsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LineChart } from 'react-native-chart-kit';
import groupBy from 'lodash/groupBy';
import { useIsFocused } from '@react-navigation/native';
import { fetchProStatus, presentPaywall } from '../utils/subscriptions';
import { Animated } from 'react-native';


const { height, width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoadingProStatus, setIsLoadingProStatus] = useState(true);
  const [stats, setStats] = useState({ total: 0, avg: 0, week: 0 });
  const [topTriggers, setTopTriggers] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [viewMode, setViewMode] = useState("weekly");
  const [streaks, setStreaks] = useState({ current: 0, best: 0 });
  const [aiInsights, setAiInsights] = useState([]);
  const [aiTips, setAiTips] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  // Load Pro status when screen is focused
  useEffect(() => {
    let mounted = true;

    const loadProStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(user);

        // 1️⃣ Check cached status first — instant, no flicker
        const cachedPro = await AsyncStorage.getItem('user_pro_status');
        if (cachedPro === 'true') {
          console.log("⚡ Cached Pro detected — skipping overlay render");
          setIsPro(true);
          setIsLoadingProStatus(false);
          return; // Stop here so overlay never flashes
        }

        // 2️⃣ Fallback to live RevenueCat check
        const status = await fetchProStatus();
        if (!mounted) return;
        setIsPro(status.isPro);
        setIsLoadingProStatus(false);

        // 3️⃣ Cache result for next launch
        await AsyncStorage.setItem('user_pro_status', status.isPro ? 'true' : 'false');
      } catch (err) {
        console.error("Error loading Pro status:", err);
        setIsLoadingProStatus(false);
      }
    };

    loadProStatus();

    return () => { mounted = false };
  }, []); // 👈 remove isFocused dependency


  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .or(`user_id.eq.${user.id},is_default.eq.true`);
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

    // Guest entries may store category_label instead of category_id
    if (entry.category_label) return entry.category_label;

    // Convert both sides to strings to avoid ID type mismatches
    const entryId = String(entry.category_id);
    const match = categories.find(c => String(c.id) === entryId);

    if (match) return `${match.emoji || '❓'} ${match.name}`;
    return "❓ Uncategorized";
  };


  useEffect(() => {
    const loadStats = async () => {
      // Wait for categories to load first
      if (categories.length === 0) {
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
      let entries = [];

      if (user) {
        const { data, error } = await supabase.from('annoyances').select('*');
        if (error) {
          Alert.alert('Error', 'Could not load analytics data. Please try again.');
          console.error('Analytics load error:', error);
          return;
        }
        entries = data || [];
      } else {
        const stored = await AsyncStorage.getItem('guest_annoyances');
        entries = stored ? JSON.parse(stored) : [];
      }

      if (entries.length > 0) {
        const avg =
          entries.reduce((sum, e) => sum + (e.rating || 0), 0) / entries.length;

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const weekCount = entries.filter(
          (e) => new Date(e.created_at) >= startOfWeek
        ).length;

        setStats({ total: entries.length, avg: avg.toFixed(1), week: weekCount });

        // --- Top Triggers ---
        const counts = {};
        entries.forEach(e => {
          const label = getCategoryLabel(e);
          counts[label] = (counts[label] || 0) + 1;
        });

        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        setTopTriggers(sorted);

        // --- Streaks ---
        const days = [...new Set(entries.map(e => new Date(e.created_at).toDateString()))]
          .sort((a, b) => new Date(a) - new Date(b));

        let current = 0;
        let best = 0;
        for (let i = 0; i < days.length; i++) {
          if (i === 0 || (new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) <= 86400000 * 1.1) {
            current++;
          } else {
            best = Math.max(best, current);
            current = 1;
          }
        }
        best = Math.max(best, current);

        // Check if streak extends to today
        const today = new Date().toDateString();
        const lastDay = days[days.length - 1];
        if (lastDay !== today) {
          current = 0; // Streak is broken
        }

        setStreaks({ current, best });

        // --- Weekly Trends ---
        const last7 = entries.filter(e => {
          const d = new Date(e.created_at);
          return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        });
        const groupedWeek = groupBy(last7, e => new Date(e.created_at).toDateString());
        const weekly = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
          const key = d.toDateString();
          return { day: d.getDate(), count: (groupedWeek[key] || []).length };
        });
        setWeeklyData(weekly);

        // --- Monthly Trends ---
        const last30 = entries.filter(e => {
          const d = new Date(e.created_at);
          return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        });
        const groupedMonth = groupBy(last30, e => new Date(e.created_at).toDateString());
        const monthly = Array.from({ length: 30 }).map((_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i));
          const key = d.toDateString();
          return { day: d.getDate(), count: (groupedMonth[key] || []).length };
        });
        setMonthlyData(monthly);

        // --- AI Insights (Pro only) ---
        if (isPro) {
          generateDailyInsights(entries);
          generateDailyTips(entries);
        }
      }
      } catch (err) {
        console.error('Error loading stats:', err);
        Alert.alert('Error', 'Could not load analytics. Try restarting the app.');
      }
    };
    loadStats();
  }, [isPro, categories, isFocused]);

  const generateDailyInsights = async (entries) => {
    const todayKey = new Date().toDateString();

    try {
      const stored = await AsyncStorage.getItem('daily_ai_insights');
      if (stored) {
        const parsed = JSON.parse(stored);

        // Get previously cached entry count, if any
        const cachedCount = parsed.entryCount || 0;
        const currentCount = entries.length;

        // Only reuse cache if same day *and* same number of entries
        if (parsed.date === todayKey && cachedCount === currentCount) {
          console.log("✅ Using cached insights for today");
          setAiInsights(parsed.insights);
          return;
        }

        console.log("🔁 Cache invalidated — new entries detected");
      }


      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const recent = entries
        .filter(e => new Date(e.created_at) >= cutoff)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Sort chronologically

      if (recent.length < 5) {
        setAiInsights(["Not enough recent data to generate insights. Log more entries!"]);
        return;
      }

      const categories = {};
      recent.forEach(e => {
        const cat = getCategoryLabel(e);
        categories[cat] = (categories[cat] || 0) + 1;
      });
      const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0];

      const avgRating =
        recent.reduce((sum, e) => sum + (e.rating || 0), 0) / recent.length;

      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      const firstAvg =
        firstHalf.reduce((s, e) => s + (e.rating || 0), 0) / (firstHalf.length || 1);
      const secondAvg =
        secondHalf.reduce((s, e) => s + (e.rating || 0), 0) / (secondHalf.length || 1);

      const trend =
        secondAvg > firstAvg + 0.5
          ? "rising"
          : secondAvg < firstAvg - 0.5
          ? "falling"
          : "stable";

      const insights = [
        `Your most common trigger this month was ${topCat}.`,
        `On average, your annoyance intensity is ${avgRating.toFixed(1)}/10 and it's looking ${trend}.`,
        `Try noticing patterns — e.g., do certain times or situations make ${topCat.toLowerCase()} annoyances worse?`,
      ];

      setAiInsights(insights);

      await AsyncStorage.setItem(
        'daily_ai_insights',
        JSON.stringify({ date: todayKey, insights, entryCount: entries.length })
      );

    } catch (err) {
      console.log("Error generating AI insights:", err.message);
    }
  };

  const generateDailyTips = async (entries) => {
    const todayKey = new Date().toDateString();

    try {
      const stored = await AsyncStorage.getItem('daily_ai_tips');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === todayKey) {
          setAiTips(parsed.tips);
          return;
        }
      }

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const recent = entries
        .filter(e => new Date(e.created_at) >= cutoff)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Sort chronologically

      if (recent.length < 3) {
        const tips = ["📝 Log more consistently — patterns become clearer with more data."];
        setAiTips(tips);
        await AsyncStorage.setItem('daily_ai_tips', JSON.stringify({ date: todayKey, tips }));
        return;
      }

      const categories = {};
      recent.forEach(e => {
        const cat = getCategoryLabel(e);
        categories[cat] = (categories[cat] || 0) + 1;
      });
      const [topCat] = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

      const avgRating =
        recent.reduce((sum, e) => sum + (e.rating || 0), 0) / recent.length;

      const tips = [];

  const catLower = topCat.toLowerCase();

  if (catLower.includes("traffic")) {
    tips.push("🚗 Traffic annoyances are high — consider leaving earlier or trying alternate routes.");
  } else if (catLower.includes("work")) {
    tips.push("🏢 Work has been stressful — build in short breaks to recharge during the day.");
  } else if (catLower.includes("social")) {
    tips.push("📱 Social media is draining — try limiting notifications during downtime.");
  } else if (catLower.includes("people")) {
    tips.push("👥 People interactions are overwhelming — set boundaries and take alone time when needed.");
  } else if (catLower.includes("tech")) {
    tips.push("💻 Tech frustrations are high — take breaks from screens and practice patience with glitches.");
  } else if (catLower.includes("home")) {
    tips.push("🏠 Home environment is stressful — declutter or create a calm corner just for you.");
  } else if (catLower.includes("money")) {
    tips.push("💰 Financial stress is weighing on you — make a budget or talk to someone about money worries.");
  } else if (catLower.includes("health")) {
    tips.push("🏥 Health concerns are frequent — prioritize rest, hydration, and consider seeing a professional.");
  } else {
    tips.push(`💡 Your most frequent trigger is ${topCat} — reflect on what patterns make these situations stressful.`);
  }

      if (avgRating > 7) {
        tips.push("🔥 Your annoyances are intense — try relaxation rituals before bed.");
      } else if (avgRating < 4) {
        tips.push("😌 Annoyance intensity is low — keep reinforcing the habits that help you stay calm.");
      }

      if (recent.length < 10) {
        tips.push("📝 More logs = better insights. Try adding a few entries each week.");
      }

      setAiTips(tips);
      await AsyncStorage.setItem('daily_ai_tips', JSON.stringify({ date: todayKey, tips }));
    } catch (err) {
      console.log("Error generating tips:", err.message);
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      Alert.alert(
        '🔐 Account Required',
        'You need to create an account to subscribe to Pro.',
        [
          { text: 'Create Account', onPress: () => navigation.navigate('SignUp', { syncGuest: true }) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    setLoading(true);
    const result = await presentPaywall();
    setLoading(false);

    if (result.success) {
      Alert.alert(
        '🎉 Welcome to Pro!',
        'Your 7-day free trial has started. Enjoy all premium features!',
        [{
          text: 'Awesome!',
          onPress: async () => {
            await AsyncStorage.setItem('user_pro_status', 'true');
            setIsPro(true);
          }
        }]
      );
    }
     else if (result.mustLogin) {
      Alert.alert('Login Required', 'Please log in to purchase Pro.');
    } else if (!result.cancelled) {
      Alert.alert('Error', result.error || 'Could not complete purchase. Please try again.');
    }
  };

  const ProContent = () => {
    let chartLabels = [];
    let chartData = [];

    if (viewMode === "weekly") {
      chartLabels = weeklyData.map(d => d.day.toString());
      chartData = weeklyData.map(d => d.count);
    } else {
      const monthLabels = monthlyData.map(d => d.day);
      chartLabels = monthLabels.map(day =>
        [5, 10, 15, 20, 25, 30].includes(day) ? day.toString() : ""
      );
      chartData = monthlyData.map(d => d.count);
    }

    return (
      <View>
        <LinearGradient colors={['#CBB2FE', '#A66BFF']} style={styles.proCard}>
          {/* Streaks */}
          <View style={styles.cardHeader}>
            <Ionicons name="flame" size={24} color="#fff" />
            <Text style={styles.cardTitle}>Streaks</Text>
          </View>
          <View style={styles.streakRow}>
            <Text style={styles.cardText}>🔥 Current: {streaks.current} days</Text>
            <Text style={styles.cardText}>🏆 Best: {streaks.best} days</Text>
          </View>

          {/* Top Triggers */}
          <View style={[styles.cardHeader, { marginTop: 12 }]}><Ionicons name="trending-up" size={24} color="#fff" /><Text style={styles.cardTitle}>Top Triggers</Text></View>
          <View style={styles.triggersRow}>
            {topTriggers.length > 0 ? (
              topTriggers.map(([label, count], idx) => (
                <View key={idx} style={styles.triggerPill}><Text style={styles.triggerText}>{label} ({count})</Text></View>
              ))
            ) : (
              <Text style={styles.cardText}>No triggers yet — log some annoyances!</Text>
            )}
          </View>

          {/* AI Insights */}
          <View style={[styles.cardHeader, { marginTop: 12 }]}><Ionicons name="sparkles" size={24} color="#fff" /><Text style={styles.cardTitle}>AI Insights</Text></View>
          <View>
            {aiInsights.length > 0 ? aiInsights.map((line, i) => (
              <Text key={i} style={styles.cardText}>• {line}</Text>
            )) : <Text style={styles.cardText}>Generating insights...</Text>}
          </View>

          {/* Deep Trends */}
          <View style={[styles.cardHeader, { marginTop: 12 }]}><Ionicons name="stats-chart" size={24} color="#fff" /><Text style={styles.cardTitle}>Deep Trends</Text></View>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, viewMode === "weekly" && styles.toggleActive]} onPress={() => setViewMode("weekly")}><Text style={styles.toggleText}>Weekly</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, viewMode === "monthly" && styles.toggleActive]} onPress={() => setViewMode("monthly")}><Text style={styles.toggleText}>Monthly</Text></TouchableOpacity>
          </View>
          {chartData.length > 0 ? (
            <LineChart
              data={{ labels: chartLabels, datasets: [{ data: chartData }] }}
              width={width - 64}
              height={220}
              yAxisSuffix=" logs"
              chartConfig={{
                backgroundGradientFrom: "#B79CED",
                backgroundGradientTo: "#6A0DAD",
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                decimalPlaces: 0,
                propsForDots: { r: "0" },
              }}
              style={{ marginVertical: 8, borderRadius: 16 }}
              bezier
            />
          ) : (
            <Text style={styles.cardText}>Not enough data yet to show trends.</Text>
          )}
        </LinearGradient>

        {/* Tips */}
        <LinearGradient colors={['#F7971E', '#FFD200']} style={styles.proCard}>
          <View style={styles.cardHeader}><Ionicons name="bulb" size={24} color="#fff" /><Text style={styles.cardTitle}>Tips & Advice</Text></View>
          {aiTips.length > 0 ? aiTips.map((line, i) => (
            <Text key={i} style={styles.cardText}>• {line}</Text>
          )) : <Text style={styles.cardText}>Generating tips...</Text>}
        </LinearGradient>
      </View>
    );
  };

  if (isLoadingProStatus) {
    return (
      <LinearGradient colors={['#E8D5FF', '#D1BAF5', '#B79CED']} style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#333' }}>Logging...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#E8D5FF', '#D1BAF5', '#B79CED']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}><Text style={styles.title}>📊 Analytics</Text><TouchableOpacity onPress={() => navigation.navigate('Settings')}><Text style={styles.settings}>⚙️</Text></TouchableOpacity></View>

        {/* Basic Stats */}
        <View style={styles.basicBar}><Text style={styles.basicText}>Logged {stats.total} annoyances • Avg {stats.avg}/10 • {stats.week} this week</Text><Text style={styles.oneLiner}>{stats.week > 5 ? "Looks like it's been a rough week 👀" : "You're keeping it cool so far 😌"}</Text></View>

        {/* Pro Section */}
        <View style={styles.proWrapper}>
          {!isPro ? (
            <BlurView intensity={40} tint="light" style={styles.proContent}>
              <ProContent />
              <View style={styles.upgradeOverlay}>
                <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inlineUpgrade}>
                  <Text style={styles.upgradeTitle}>Unlock Pro Insights</Text>
                  <Text style={styles.upgradeSubtitle}>Get access to your full analytics experience</Text>
                  <View style={styles.features}>
                    <View style={styles.featureRow}><Ionicons name="trending-up" size={20} color="#fff" /><Text style={styles.featureText}>Top Triggers</Text></View>
                    <View style={styles.featureRow}><Ionicons name="sparkles" size={20} color="#fff" /><Text style={styles.featureText}>AI Insights</Text></View>
                    <View style={styles.featureRow}><Ionicons name="color-palette" size={20} color="#fff" /><Text style={styles.featureText}>Custom Colors</Text></View>
                    <View style={styles.featureRow}><Ionicons name="stats-chart" size={20} color="#fff" /><Text style={styles.featureText}>Deep Trends</Text></View>
                    <View style={styles.featureRow}><Ionicons name="bulb" size={20} color="#fff" /><Text style={styles.featureText}>Tips & Advice</Text></View>
                  </View>
                  <TouchableOpacity 
                    style={styles.upgradeBtn} 
                    onPress={handleUpgrade}
                    disabled={loading}
                  >
                    <Text style={styles.upgradeText}>
                      {loading ? 'Processing...' : 'Start 7-Day Free Trial'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </BlurView>
          ) : (
            <View style={styles.proContent}><ProContent /></View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: height * 0.1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: '700', color: '#6B21A8', letterSpacing: 0.3 },
  settings: { fontSize: 20 },
basicBar: {
  backgroundColor: 'rgba(255,255,255,0.6)',
  padding: 16,
  borderRadius: 18,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.4)',
  shadowColor: '#A66BFF',
  shadowOpacity: 0.15,
  shadowRadius: 10,
},
  basicText: { fontWeight: '600', color: '#3F3F46', fontSize: 15 },
  oneLiner: { marginTop: 6, color: '#6B7280', fontStyle: 'italic', fontSize: 13 },
  proWrapper: { marginTop: 10, marginBottom: 30, position: 'relative' },
  proContent: { borderRadius: 16, overflow: 'hidden' },
  upgradeOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
inlineUpgrade: {
  padding: 30,
  alignItems: 'center',
  borderRadius: 24,
  width: '92%',
  minHeight: 440,
  justifyContent: 'center',
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.4)',
  shadowColor: '#B79CED',
  shadowOpacity: 0.3,
  shadowRadius: 12,
},
  upgradeTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  upgradeSubtitle: { color: '#fff', marginBottom: 16, textAlign: 'center' },
  features: { width: '100%', marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureText: { fontSize: 15, color: '#fff', marginLeft: 10, fontWeight: '500' },
  upgradeBtn: { width: '100%', borderRadius: 12, overflow: 'hidden', marginTop: 6 },
  upgradeText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  upgradeGradient: { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', borderRadius: 12 },
  proCard: { borderRadius: 18, padding: 20, marginBottom: 20, shadowColor: '#A66BFF', shadowOpacity: 0.2, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 8 },
  cardText: { fontSize: 14, color: '#fff', marginBottom: 4 },
  bold: { fontWeight: '700', color: '#fff' },
  triggersRow: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  triggerPill: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8, marginBottom: 6 },
  triggerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 20 },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 14, marginHorizontal: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  toggleActive: { backgroundColor: 'rgba(255,192,203,0.7)', borderColor: '#fff' },
  toggleText: { color: '#fff', fontWeight: '600' },
});