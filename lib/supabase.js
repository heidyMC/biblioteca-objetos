import 'react-native-url-polyfill/auto'
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js'

// Adaptador de almacenamiento seguro para guardar la sesión del usuario
const ExpoSecureStoreAdapter = {
  getItem: (key) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key, value) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key) => {
    SecureStore.deleteItemAsync(key);
  },
};


const supabaseUrl = 'https://rmhcjuuvsdakgnwtqbtj.supabase.co'; // Pega tu Project URL aquí
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtaGNqdXV2c2Rha2dud3RxYnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTA4MzUsImV4cCI6MjA3NTIyNjgzNX0.ZMC_Q4gIkh2Cp_LCc6DSS1IUANHfIXEfqz9vUkwyCv8'; // Pega tu Project API Key (anon) aquí

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});