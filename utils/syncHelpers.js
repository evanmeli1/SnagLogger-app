// utils/syncHelpers.js
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * Checks if account is clean (no existing data)
 * Returns true if clean, false if has data
 */
export const isAccountClean = async (userId) => {
  try {
    const { data: cats } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: snags } = await supabase
      .from('annoyances')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const hasData = (cats && cats.length > 0) || (snags && snags.length > 0);
    return !hasData;
  } catch (err) {
    console.log("Error checking account status:", err.message);
    return false; // Assume not clean on error
  }
};

/**
 * Checks if guest has local data
 * Returns true if has guest data
 */
export const hasGuestData = async () => {
  try {
    const annoyances = await AsyncStorage.getItem('guest_annoyances');
    const categories = await AsyncStorage.getItem('guest_categories');
    
    const hasAnnoyances = annoyances && JSON.parse(annoyances).length > 0;
    const hasCategories = categories && JSON.parse(categories).length > 0;
    
    return hasAnnoyances || hasCategories;
  } catch (err) {
    console.log("Error checking guest data:", err.message);
    return false;
  }
};

/**
 * Syncs guest data to account - ONLY if account is clean
 * Shows alert if account already has data
 */
export const syncGuestDataSafely = async (userId) => {
  try {
    // Check if guest has any data to sync
    const guestHasData = await hasGuestData();
    if (!guestHasData) {
      console.log("No guest data to sync");
      return { success: true, synced: false };
    }

    // Check if account is clean
    const accountIsClean = await isAccountClean(userId);
    
    if (!accountIsClean) {
      console.log("❌ Account already has data - blocking merge");
      Alert.alert(
        '⚠️ Account Has Existing Data',
        'This account already contains snag logs. To prevent conflicts, your local guest data will not be synced.\n\nYour guest data will remain on this device.',
        [{ text: 'OK' }]
      );
      return { success: false, reason: 'account_has_data' };
    }

    // Account is clean - safe to sync
    console.log("✅ Account is clean - syncing guest data...");
    await syncGuestData(userId);
    return { success: true, synced: true };

  } catch (err) {
    console.log("Sync safety check failed:", err.message);
    return { success: false, reason: 'error', error: err.message };
  }
};

/**
 * The actual sync logic (your existing code)
 */
const syncGuestData = async (userId) => {
  try {
    // Move guest categories first
    const storedCategories = await AsyncStorage.getItem('guest_categories');
    let categoryIdMap = {};

    if (storedCategories) {
      const guestCategories = JSON.parse(storedCategories);
      if (guestCategories.length > 0) {
        const { data: insertedCats, error: catError } = await supabase
          .from('categories')
          .insert(
            guestCategories.map(c => ({
              user_id: userId,
              name: c.name,
              emoji: c.emoji || '❓',
              color: c.color || '#6A0DAD',
              is_default: false,
              created_at: c.created_at || new Date().toISOString(),
            }))
          )
          .select();

        if (catError) {
          console.log("Category sync error:", catError.message);
        } else {
          guestCategories.forEach((c, idx) => {
            categoryIdMap[c.id] = insertedCats[idx].id;
          });
          await AsyncStorage.removeItem('guest_categories');
        }
      }
    }

    // Move guest annoyances
    const storedAnnoyances = await AsyncStorage.getItem('guest_annoyances');
    if (storedAnnoyances) {
      const guestAnnoyances = JSON.parse(storedAnnoyances);
      if (guestAnnoyances.length > 0) {
        const mapped = guestAnnoyances.map(a => ({
          user_id: userId,
          text: a.text,
          rating: a.rating,
          created_at: a.created_at || new Date().toISOString(),
          category_id: (() => {
            if (!a.category_id) return null;
            if (typeof a.category_id === 'string') {
              if (a.category_id.startsWith('db-')) {
                const originalId = a.category_id.replace('db-', '');
                return categoryIdMap[originalId] || null;
              } else if (a.category_id.startsWith('default-')) {
                return parseInt(a.category_id.replace('default-', ''));
              }
            }
            return categoryIdMap[a.category_id] || a.category_id;
          })(),
        }));

        const { error: annError } = await supabase
          .from('annoyances')
          .insert(mapped);

        if (annError) {
          console.log("Annoyance sync error:", annError.message);
        } else {
          await AsyncStorage.removeItem('guest_annoyances');
        }
      }
    }

    console.log("✅ Guest data synced successfully");
  } catch (err) {
    console.log("Sync guest data failed:", err.message);
    throw err;
  }
};