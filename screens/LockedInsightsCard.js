import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LockedInsightsCard({ onUpgrade }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>🔒 Unlock Full Insights</Text>
      <Text>📊 Pattern Recognition</Text>
      <Text>⏰ Peak Annoyance Times</Text>
      <Text>🎯 Trigger Analysis</Text>
      <Text>📑 Monthly Reports</Text>
      <Text>📤 Export Your Data</Text>

      <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
        <Text style={styles.upgradeText}>Upgrade to Pro</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#eee', padding: 16, borderRadius: 12 },
  title: { fontWeight: '700', marginBottom: 8 },
  upgradeBtn: {
    marginTop: 12,
    backgroundColor: '#6A0DAD',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeText: { color: '#fff', fontWeight: '600' },
});
