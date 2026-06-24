import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import Logo from '../../components/Logo'

// Stripe redirects here after checkout. The webhook flips the plan to 'pro'
// server-side; we poll the profile until it lands, then celebrate + redirect.
export default function PaymentSuccess() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [done, setDone] = useState(false)

  useEffect(() => {
    let tries = 0
    let timer
    const poll = async () => {
      const p = await refreshProfile().catch(() => null)
      tries += 1
      if (p?.plan === 'pro' || tries >= 6) {
        setDone(true)
        timer = setTimeout(() => navigate('/', { replace: true }), 3000)
      } else {
        timer = setTimeout(poll, 1500)
      }
    }
    poll()
    return () => clearTimeout(timer)
  }, [navigate, refreshProfile])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
      <Logo size="lg" />
      {!done ? (
        <>
          <div className="mt-2 h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-slate-500">{t('payment.verifying')}</p>
        </>
      ) : (
        <>
          <div className="text-5xl">🎉</div>
          <h1 className="text-xl font-bold text-slate-900">{t('payment.welcome')}</h1>
          <p className="text-sm text-slate-500">{t('payment.redirecting')}</p>
        </>
      )}
    </div>
  )
}
