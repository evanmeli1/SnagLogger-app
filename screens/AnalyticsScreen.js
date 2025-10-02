// screens/AnalyticsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LineChart } from 'react-native-chart-kit';
import groupBy from 'lodash/groupBy';

const { height, width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
  const [isPro, setIsPro] = useState(false);
  const [stats, setStats] = useState({ total: 0, avg: 0, week: 0 });
  const [topTriggers, setTopTriggers] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [viewMode, setViewMode] = useState("weekly");
  const [streaks, setStreaks] = useState({ current: 0, best: 0 });
  const [aiInsights, setAiInsights] = useState([]);
  const [aiTips, setAiTips] = useState([]);

  // ✅ categories state (instead of hardcoded)
  const [categories, setCategories] = useState([]);

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
          // guest fallback
          const stored = await AsyncStorage.getItem('guest_categories');
          setCategories(stored ? JSON.parse(stored) : []);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    loadCategories();
  }, []);

  // ✅ updated lookup
  const getCategoryLabel = (entry) => {
    if (!entry) return "Uncategorized";
    const match = categories.find(c => c.id === entry.category_id);
    if (match) return `${match.emoji || '❓'} ${match.name}`;
    return "Uncategorized";
  };

  useEffect(() => {
    const loadPro = async () => {
      const stored = await AsyncStorage.getItem("isPro");
      if (stored === "true") setIsPro(true);
    };
    loadPro();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let entries = [];

      if (user) {
        const { data } = await supabase.from('annoyances').select('*');
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
          if (i === 0 || new Date(days[i]) - new Date(days[i - 1]) === 86400000) {
            current++;
          } else {
            best = Math.max(best, current);
            current = 1;
          }
        }
        best = Math.max(best, current);
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
    };
    loadStats();
  }, [isPro, categories]); // depend on categories for labels

  // ✅ Generate and cache daily AI insights
  const generateDailyInsights = async (entries) => {
    const todayKey = new Date().toDateString();

    try {
      const stored = await AsyncStorage.getItem('daily_ai_insights');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === todayKey) {
          setAiInsights(parsed.insights);
          return;
        }
      }

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const recent = entries.filter(e => new Date(e.created_at) >= cutoff);

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
        `Your most common trigger this month was **${topCat}**.`,
        `On average, your annoyance intensity is ${avgRating.toFixed(1)}/10 and it's looking ${trend}.`,
        `Try noticing patterns — e.g., do certain times or situations make ${topCat.toLowerCase()} annoyances worse?`,
      ];

      setAiInsights(insights);

      await AsyncStorage.setItem(
        'daily_ai_insights',
        JSON.stringify({ date: todayKey, insights })
      );
    } catch (err) {
      console.log("Error generating AI insights:", err.message);
    }
  };

  // ✅ Generate and cache daily AI tips
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
      const recent = entries.filter(e => new Date(e.created_at) >= cutoff);

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

      if (topCat.includes("Traffic")) {
        tips.push("🚗 Traffic annoyances are high — consider leaving earlier or trying alternate routes.");
      } else if (topCat.includes("Work")) {
        tips.push("💼 Work has been stressful — build in short breaks to recharge during the day.");
      } else if (topCat.includes("Social")) {
        tips.push("📱 Social annoyances spike — try limiting notifications during downtime.");
      } else {
        tips.push(`💡 Your most frequent trigger is **${topCat}** — reflect on what makes ${topCat.toLowerCase()} stressful and how you might ease it.`);
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
        <LinearGradient colors={['#B79CED', '#6A0DAD']} style={styles.proCard}>
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
                <LinearGradient colors={['#B79CED', '#6A0DAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inlineUpgrade}>
                  <Text style={styles.upgradeTitle}>Unlock Pro Insights</Text>
                  <Text style={styles.upgradeSubtitle}>Get access to your full analytics experience</Text>
                  <View style={styles.features}>
                    <View style={styles.featureRow}><Ionicons name="trending-up" size={20} color="#fff" /><Text style={styles.featureText}>Top Triggers</Text></View>
                    <View style={styles.featureRow}><Ionicons name="sparkles" size={20} color="#fff" /><Text style={styles.featureText}>AI Insights</Text></View>
                    <View style={styles.featureRow}><Ionicons name="color-palette" size={20} color="#fff" /><Text style={styles.featureText}>Custom Colors</Text></View>
                    <View style={styles.featureRow}><Ionicons name="stats-chart" size={20} color="#fff" /><Text style={styles.featureText}>Deep Trends</Text></View>
                    <View style={styles.featureRow}><Ionicons name="bulb" size={20} color="#fff" /><Text style={styles.featureText}>Tips & Advice</Text></View>
                  </View>
                  <TouchableOpacity style={styles.upgradeBtn} onPress={() => setIsPro(true)}><Text style={styles.upgradeText}>Start 7-Day Free Trial</Text></TouchableOpacity>
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
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  settings: { fontSize: 20 },
  basicBar: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  basicText: { fontWeight: '600', color: '#333' },
  oneLiner: { marginTop: 4, color: '#666', fontStyle: 'italic' },
  proWrapper: { marginTop: 10, marginBottom: 30, position: 'relative' },
  proContent: { borderRadius: 16, overflow: 'hidden' },
  upgradeOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  inlineUpgrade: { padding: 28, alignItems: 'center', borderRadius: 20, width: '92%', minHeight: 420, justifyContent: 'center' },
  upgradeTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  upgradeSubtitle: { color: '#fff', marginBottom: 16, textAlign: 'center' },
  features: { width: '100%', marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureText: { fontSize: 15, color: '#fff', marginLeft: 10, fontWeight: '500' },
  upgradeBtn: { marginTop: 12, backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: '100%', alignItems: 'center' },
  upgradeText: { color: '#6A0DAD', fontWeight: '700' },
  proCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
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
