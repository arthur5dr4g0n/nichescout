import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from './Toast'

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 16 3 9.1 7.6 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.1 42.3 16 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C40.9 36 44 30.6 44 24c0-1.4-.1-2.5-.4-3.5z" />
    </svg>
  )
}

export default function GoogleButton() {
  const { t } = useTranslation()
  const { signInWithGoogle } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const go = async () => {
    setBusy(true)
    // On success Supabase redirects the browser to Google; on error it returns here.
    const { error } = (await signInWithGoogle()) || {}
    if (error) {
      setBusy(false)
      const msg = /not enabled|Unsupported provider/i.test(error.message || '')
        ? t('auth.googleNotEnabled')
        : error.message || t('errors.generic')
      toast?.error(msg)
    }
  }

  return (
    <button type="button" onClick={go} disabled={busy} className="btn-ghost w-full">
      <GoogleG /> {t('auth.google')}
    </button>
  )
}
