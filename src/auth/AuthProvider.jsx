import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const GUEST = { id: 'guest', email: null, guest: true }
const origin = typeof window !== 'undefined' ? window.location.origin : ''

export function AuthProvider({ children }) {
  // Guest mode: no Supabase keys -> usable immediately, data in localStorage.
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(isSupabaseConfigured ? null : GUEST)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const api = useMemo(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured,
      isGuest: !isSupabaseConfigured,

      signUp: async (email, password) => {
        if (!isSupabaseConfigured) return { error: { message: 'not_configured' } }
        return supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/login` } })
      },
      signIn: async (email, password, rememberMe = true) => {
        if (!isSupabaseConfigured) return { error: { message: 'not_configured' } }
        localStorage.setItem('marketmax.remember', rememberMe ? 'true' : 'false')
        return supabase.auth.signInWithPassword({ email, password })
      },
      signOut: async () => {
        if (!isSupabaseConfigured) return { error: null }
        return supabase.auth.signOut()
      },
      resetPassword: async (email) => {
        if (!isSupabaseConfigured) return { error: { message: 'not_configured' } }
        return supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` })
      },
      updatePassword: async (password) => {
        if (!isSupabaseConfigured) return { error: { message: 'not_configured' } }
        return supabase.auth.updateUser({ password })
      },
    }),
    [user, session, loading],
  )

  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>
}
