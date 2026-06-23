import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    await resetPassword(email)
    setBusy(false)
    setSent(true)
  }

  return (
    <div className="card p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-900">{t('auth.resetTitle')}</h1>
      {sent ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{t('auth.resetSent')}</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">{t('auth.email')}</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? '…' : t('auth.sendResetLink')}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-xs text-slate-500">
        <Link className="font-semibold text-brand hover:underline" to="/login">{t('auth.backToLogin')}</Link>
      </p>
    </div>
  )
}
