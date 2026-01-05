import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = 'https://gkwwmigflhyntdwyqpip.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd3dtaWdmbGh5bnRkd3lxcGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDM2NzYsImV4cCI6MjA1MDQ3OTY3Nn0.t3meGz_cT4TzjGMpXr_5DZpVm9gSjPw1fk-eR5Z2oo4'

// Storage adapter que funciona em todas as plataformas
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Na web, usar localStorage
    return {
      getItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key)
        }
        return null
      },
      setItem: async (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value)
        }
      },
      removeItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key)
        }
      },
    }
  } else {
    // Em mobile, usar SecureStore
    return {
      getItem: async (key: string) => {
        return await SecureStore.getItemAsync(key)
      },
      setItem: async (key: string, value: string) => {
        await SecureStore.setItemAsync(key, value)
      },
      removeItem: async (key: string) => {
        await SecureStore.deleteItemAsync(key)
      },
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
