import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getProfile, logActivity } from '../lib/account'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const GUEST = { id: 'guest', email: null, guest: true }
const origin = typeof window !== 'undefined' ? window.location.origin : ''

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(isSupabaseConfigured ? null : GUEST)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const loadProfile = useCallback(async (uid) => {
    const p = await getProfile(uid)
    setProfile(p)
    return p
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        loadProfile(data.session.user.id)
        // Log a login when returning from an OAuth (Google) redirect.
        if (localStorage.getItem('marketmax.pending_oauth')) {
          localStorage.removeItem('marketmax.pending_oauth')
          logActivity(data.session.user.id, 'login', { method: 'google' })
        }
      }
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) loadProfile(s.user.id)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const api = useMemo(
    () => ({
      user,
      session,
      profile,
      role: profile?.role || 'user',
      plan: profile?.plan || 'free',
      loading,
      configured: isSupabaseConfigured,
      isGuest: !isSupabaseConfigured,

      refreshProfile: () => (user?.id ? loadProfile(user.id) : Promise.resolve(null)),
      setProfileLocal: (patch) => setProfile((p) => ({ ...(p || {}), ...patch })),

      signUp: async (email, password) => {
        if (!isSupabaseConfigured) return { error: { message: 'not_configured' } }
        return supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/login` } })
      },
      signIn: async (email, password, rememberMe = true) => {
        if (!isSupabaseConfigured) return { error: { message: 'not_configured' } }
        localStorage.setItem('marketmax.remember', rememberMe ? 'true' : 'false')
        const res = await supabase.auth.signInWithPassword({ email, password })
        if (!res.error && res.data?.user) logActivity(res.data.user.id, 'login', { method: 'password' })
        return res
      },
      signInWithGoogle: async () => {
        if (!isSupabaseConfigured) return { error: { message: 'not_configured' } }
        localStorage.setItem('marketmax.pending_oauth', '1')
        return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin } })
      },
      signOut: async (scope) => {
        if (!isSupabaseConfigured) return { error: null }
        if (user?.id) await logActivity(user.id, 'logout', scope === 'global' ? { scope: 'global' } : {})
        return supabase.auth.signOut(scope === 'global' ? { scope: 'global' } : undefined)
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
    [user, session, profile, loading, loadProfile],
  )

  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>
}
