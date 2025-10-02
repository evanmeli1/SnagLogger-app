import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';

export default function UpgradeModal({ visible, onClose, onSuccess }) {
  const handleUpgrade = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        const packageToBuy = offerings.current.availablePackages[0];
        const purchaseMade = await Purchases.purchasePackage(packageToBuy);

        console.log('✅ Purchase success:', purchaseMade);
        if (onSuccess) onSuccess(purchaseMade);
        onClose();
      } else {
        console.warn('⚠️ No available packages found.');
      }
    } catch (e) {
      if (!e.userCancelled) {
        console.error('❌ Purchase failed:', e);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient colors={['#B79CED', '#6A0DAD']} style={styles.modal}>
          <Text style={styles.title}>Upgrade to Pro</Text>
          <Text style={styles.subtitle}>Unlock your full analytics experience</Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureRow}>
              <Ionicons name="trending-up" size={20} color="#fff" />
              <Text style={styles.featureText}>Top Triggers</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.featureText}>AI Insights</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="color-palette" size={20} color="#fff" />
              <Text style={styles.featureText}>Custom Colors</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="stats-chart" size={20} color="#fff" />
              <Text style={styles.featureText}>Deep Trends</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="newspaper" size={20} color="#fff" />
              <Text style={styles.featureText}>Smart Summaries</Text>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
            <Text style={styles.upgradeText}>Start 7-Day Free Trial</Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Maybe later</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modal: { 
    width: '85%', 
    borderRadius: 16, 
    padding: 24, 
    alignItems: 'center', 
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#fff', 
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 14, 
    color: '#eee', 
    marginBottom: 20, 
    textAlign: 'center',
  },
  features: { width: '100%', marginBottom: 24 },
  featureRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  featureText: { 
    fontSize: 15, 
    color: '#fff', 
    marginLeft: 10, 
    fontWeight: '500' 
  },
  upgradeBtn: { 
    backgroundColor: '#fff', 
    paddingVertical: 14, 
    paddingHorizontal: 28, 
    borderRadius: 30, 
    marginBottom: 14,
    width: '100%',
    alignItems: 'center',
  },
  upgradeText: { 
    color: '#6A0DAD', 
    fontWeight: '700', 
    fontSize: 16 
  },
  cancelText: { 
    color: '#fff', 
    fontSize: 14, 
    marginTop: 6,
  },
});
