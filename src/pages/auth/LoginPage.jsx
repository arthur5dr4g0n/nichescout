import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { useToast } from '../../components/Toast'

export default function LoginPage() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    const { error } = await signIn(email, password, remember)
    setBusy(false)
    if (error) {
      setErr(error.message === 'Invalid login credentials' ? t('errors.invalidLogin') : error.message || t('errors.generic'))
      return
    }
    toast?.success(t('auth.welcome'))
    navigate(loc.state?.from || '/', { replace: true })
  }

  return (
    <div className="card p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-900">{t('auth.loginTitle')}</h1>
      <form onSubmit={submit} className="space-y-3">
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('auth.email')}</label>
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('auth.password')}</label>
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-line text-brand focus:ring-brand" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            {t('auth.rememberMe')}
          </label>
          <Link to="/forgot-password" className="text-xs font-medium text-brand hover:underline">{t('auth.forgotPassword')}</Link>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-500">
        {t('auth.noAccount')} <Link className="font-semibold text-brand hover:underline" to="/signup">{t('auth.signupHere')}</Link>
      </p>
    </div>
  )
}
