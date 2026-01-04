import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key)
    }
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value)
      return
    }
    SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key)
      return
    }
    SecureStore.deleteItemAsync(key)
  },
}

const supabaseUrl = 'https://fkjjjpgxkjhqkhmdpmzk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrampqcGd4a2pocWtobWRwbXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDI0NTYsImV4cCI6MjA4MjE3ODQ1Nn0.c0wUGT2Ah2RW5lPJ5EhS738349AdvXsnnsoQvNjM5PY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
