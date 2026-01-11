import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import type { Database } from '@boatacademy/shared';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables d\'environnement manquantes : EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY doivent être définies dans .env'
  );
}

// Warn if using localhost on physical device (won't work)
if (Device.isDevice && supabaseUrl.includes('localhost')) {
  console.warn(
    '[Supabase] WARNING: Using localhost URL on physical device. ' +
    'This will not work! Use your LAN IP (e.g., http://192.168.x.x:54321) ' +
    'or a cloud Supabase instance.'
  );
}

/**
 * Secure storage adapter for React Native
 */
const secureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Supabase client for React Native
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
