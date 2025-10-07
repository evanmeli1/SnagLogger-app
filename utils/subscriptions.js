// utils/subscriptions.js
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';
import { supabase } from '../supabase';

/**
 * Initialize RevenueCat with user ID after login
 */
export const initializeRevenueCat = async (userId) => {
  try {
    await Purchases.logIn(userId);
    console.log('RevenueCat initialized for user:', userId);
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
};

/**
 * Fetch current Pro status from Supabase
 */
export const fetchProStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { isPro: false, expiresAt: null, status: 'guest' };
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { isPro: false, expiresAt: null, status: 'none' };
      }
      throw error;
    }

    const now = new Date();
    const expiresAt = data.pro_expires_at ? new Date(data.pro_expires_at) : null;
    const isActive = data.is_pro && (!expiresAt || expiresAt > now);

    return {
      isPro: isActive,
      expiresAt: expiresAt,
      status: data.subscription_status || 'none',
    };
  } catch (error) {
    console.error('Error fetching Pro status:', error);
    return { isPro: false, expiresAt: null, status: 'error' };
  }
};

/**
 * Sync RevenueCat subscription status to Supabase
 */
export const syncSubscriptionStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user logged in, skipping sync');
      return { isPro: false };
    }

    const customerInfo = await Purchases.getCustomerInfo();
    
    console.log('🔍 Full customerInfo:', JSON.stringify(customerInfo, null, 2));
    console.log('🔍 Active entitlements:', Object.keys(customerInfo.entitlements.active));
    console.log('🔍 All entitlements:', Object.keys(customerInfo.entitlements.all));
    
    const isPro = typeof customerInfo.entitlements.active['pro access monthly'] !== 'undefined';
    console.log('🔍 isPro calculated as:', isPro);
    
    let expiresAt = null;
    let status = 'none';
    
    if (isPro) {
      const entitlement = customerInfo.entitlements.active['pro access monthly'];
      expiresAt = entitlement.expirationDate;
      status = entitlement.willRenew ? 'active' : 'cancelled';
    } else {
      if (customerInfo.entitlements.all['pro access monthly']) {
        status = 'expired';
        expiresAt = customerInfo.entitlements.all['pro access monthly'].expirationDate;
      }
    }

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      await supabase
        .from('subscriptions')
        .update({
          is_pro: isPro,
          pro_expires_at: expiresAt,
          subscription_status: status,
          revenue_cat_user_id: customerInfo.originalAppUserId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          is_pro: isPro,
          pro_expires_at: expiresAt,
          subscription_status: status,
          revenue_cat_user_id: customerInfo.originalAppUserId,
        });
    }

    console.log('Subscription synced:', { isPro, status, expiresAt });
    return { isPro, expiresAt, status };
  } catch (error) {
    console.error('Error syncing subscription:', error);
    return { isPro: false };
  }
};

/**
 * Present the paywall to purchase Pro
 */
export const presentPaywall = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('MUST_LOGIN');
    }

    await initializeRevenueCat(user.id);

    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current) {
      throw new Error('No offerings configured in RevenueCat');
    }

    const monthlyPackage = offerings.current.availablePackages.find(
      pkg => pkg.identifier === '$rc_monthly' || pkg.packageType === 'MONTHLY'
    );

    if (!monthlyPackage) {
      throw new Error('Monthly package not found');
    }

    const purchaseResult = await Purchases.purchasePackage(monthlyPackage);
    const isPro = typeof purchaseResult.customerInfo.entitlements.active['pro access monthly'] !== 'undefined';
    
    if (isPro) {
      await syncSubscriptionStatus();
      return { success: true, isPro: true };
    }

    return { success: false, isPro: false };
  } catch (error) {
    if (error.userCancelled) {
      return { success: false, cancelled: true };
    }
    
    if (error.message === 'MUST_LOGIN') {
      return { success: false, mustLogin: true };
    }

    console.error('Purchase error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Must be logged in to restore purchases');
    }

    await initializeRevenueCat(user.id);
    const customerInfo = await Purchases.restorePurchases();
    const isPro = typeof customerInfo.entitlements.active['pro access monthly'] !== 'undefined';
    
    await syncSubscriptionStatus();
    return { success: true, isPro };
  } catch (error) {
    console.error('Restore error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get offering details for display
 */
export const getOfferingDetails = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current) {
      return null;
    }

    const monthlyPackage = offerings.current.availablePackages.find(
      pkg => pkg.identifier === '$rc_monthly' || pkg.packageType === 'MONTHLY'
    );

    if (!monthlyPackage) {
      return null;
    }

    return {
      price: monthlyPackage.product.priceString,
      trialPeriod: monthlyPackage.product.introPrice?.periodNumberOfUnits || 7,
      currencyCode: monthlyPackage.product.currencyCode,
    };
  } catch (error) {
    console.error('Error getting offering details:', error);
    return null;
  }
};