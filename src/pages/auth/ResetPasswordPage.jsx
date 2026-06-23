import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { useToast } from '../../components/Toast'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const { updatePassword } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setErr(null)
    if (password.length < 6) return setErr(t('auth.tooShort'))
    if (password !== confirm) return setErr(t('auth.mismatch'))
    setBusy(true)
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) return setErr(error.message || t('errors.generic'))
    toast?.success(t('auth.passwordUpdated'))
    navigate('/login')
  }

  return (
    <div className="card p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-900">{t('auth.resetTitle')}</h1>
      <form onSubmit={submit} className="space-y-3">
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('auth.newPassword')}</label>
          <input className="input" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('auth.confirmPassword')}</label>
          <input className="input" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('auth.passwordPlaceholder')} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? '…' : t('auth.updatePassword')}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-500">
        <Link className="font-semibold text-brand hover:underline" to="/login">{t('auth.backToLogin')}</Link>
      </p>
    </div>
  )
}
