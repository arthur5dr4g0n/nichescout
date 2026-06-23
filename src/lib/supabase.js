import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// When unset, the app runs in "guest mode" (localStorage only, no login wall).
export const isSupabaseConfigured = Boolean(url && anonKey)

// "Remember me": persist in localStorage (default) or sessionStorage (session-only).
const remember = () => localStorage.getItem('marketmax.remember') !== 'false'
const hybridStorage = {
  getItem: (k) => (remember() ? localStorage : sessionStorage).getItem(k),
  setItem: (k, v) => (remember() ? localStorage : sessionStorage).setItem(k, v),
  removeItem: (k) => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  },
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storage: hybridStorage },
    })
  : null
