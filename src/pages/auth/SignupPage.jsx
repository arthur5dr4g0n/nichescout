import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { useToast } from '../../components/Toast'
import GoogleButton from '../../components/GoogleButton'

export default function SignupPage() {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [info, setInfo] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setErr(null)
    if (password.length < 6) return setErr(t('auth.tooShort'))
    if (password !== confirm) return setErr(t('auth.mismatch'))
    setBusy(true)
    const { error } = await signUp(email, password)
    setBusy(false)
    if (error) {
      setErr(error.message?.includes('already') ? t('errors.emailInUse') : error.message || t('errors.generic'))
      return
    }
    setInfo(t('auth.checkEmail'))
    toast?.success(t('auth.createdToast'))
    setTimeout(() => navigate('/login'), 2500)
  }

  return (
    <div className="card p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-900">{t('auth.signupTitle')}</h1>
      <GoogleButton />
      <div className="my-3 flex items-center gap-2 text-xs text-slate-400">
        <span className="h-px flex-1 bg-line" /> {t('auth.or')} <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={submit} className="space-y-3">
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
        {info && <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">{info}</p>}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('auth.email')}</label>
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('auth.password')}</label>
          <input className="input" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('auth.confirmPassword')}</label>
          <input className="input" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('auth.passwordPlaceholder')} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? t('auth.creating') : t('auth.createAccount')}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-500">
        {t('auth.haveAccount')} <Link className="font-semibold text-brand hover:underline" to="/login">{t('auth.loginHere')}</Link>
      </p>
    </div>
  )
}
