import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

// Landing page for the OAuth (Google) redirect. It's a PUBLIC route, so no
// auth guard bounces it while Supabase exchanges the code for a session.
export default function AuthCallback() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!supabase) {
      navigate('/', { replace: true })
      return
    }
    let done = false
    const finish = (session) => {
      if (done) return
      done = true
      navigate(session ? '/' : '/login', { replace: true }) // dashboard is at "/"
    }
    // getSession() awaits the URL code exchange and returns the new session.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(data.session)
    })
    // Backup: react the moment the session is established.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) finish(session)
    })
    // Safety net: if nothing resolves, fall back to login.
    const timer = setTimeout(() => finish(null), 5000)
    return () => {
      clearTimeout(timer)
      sub.subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <p className="text-sm text-slate-500">{t('auth.connecting')}</p>
    </div>
  )
}
