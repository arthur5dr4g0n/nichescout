import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import { updateProfile, getActivity, deleteOwnAccount, logActivity } from '../lib/account'
import { openBillingPortal } from '../lib/stripe'
import { EmptyState, Badge } from '../components/ui'
import { timeAgo } from '../utils/format'

function Section({ title, children }) {
  return (
    <div className="card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { user, profile, role, plan, isGuest, configured, setProfileLocal, refreshProfile, signOut } = useAuth()

  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [savingId, setSavingId] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwErr, setPwErr] = useState(null)
  const [activity, setActivity] = useState([])
  const [confirmDel, setConfirmDel] = useState('')
  const [delOpen, setDelOpen] = useState(false)

  useEffect(() => {
    setName(profile?.full_name || '')
    setAvatar(profile?.avatar_url || '')
  }, [profile])

  useEffect(() => {
    if (user?.id && configured && !isGuest) getActivity(user.id, 10).then(setActivity)
  }, [user?.id, configured, isGuest])

  if (isGuest) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-900">{t('profile.title')}</h1>
        <EmptyState icon="👤" title={t('profile.guestTitle')} hint={t('profile.guestNotice')} />
      </div>
    )
  }

  const saveIdentity = async () => {
    setSavingId(true)
    const { error } = await updateProfile(user.id, { full_name: name, avatar_url: avatar })
    setSavingId(false)
    if (error) return toast?.error(t('toast.syncError'))
    setProfileLocal({ full_name: name, avatar_url: avatar })
    logActivity(user.id, 'profile_update')
    toast?.success(t('profile.saved'))
  }

  const uploadAvatar = async (file) => {
    if (!file) return
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) return toast?.error(t('profile.uploadFail'))
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatar(data.publicUrl)
    toast?.info(t('profile.uploadOk'))
  }

  const changePassword = async () => {
    setPwErr(null)
    if (newPw.length < 6) return setPwErr(t('auth.tooShort'))
    if (newPw !== confirmPw) return setPwErr(t('auth.mismatch'))
    setPwBusy(true)
    // verify the old password by re-authenticating
    const { error: reErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPw })
    if (reErr) {
      setPwBusy(false)
      return setPwErr(t('profile.wrongOld'))
    }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwBusy(false)
    if (error) return setPwErr(error.message)
    logActivity(user.id, 'password_change')
    setOldPw(''); setNewPw(''); setConfirmPw('')
    toast?.success(t('profile.passwordChanged'))
  }

  const logoutAll = async () => {
    await signOut('global')
    toast?.info(t('profile.loggedOutAll'))
    navigate('/login')
  }

  const doDelete = async () => {
    await logActivity(user.id, 'delete_account')
    const { error } = await deleteOwnAccount()
    if (error) return toast?.error(t('toast.syncError'))
    await signOut()
    toast?.info(t('profile.deleted'))
    navigate('/')
  }

  const ACTION_LABEL = {
    login: t('activity.login'), logout: t('activity.logout'), signup: t('activity.signup'),
    profile_update: t('activity.profile_update'), password_change: t('activity.password_change'),
    role_change: t('activity.role_change'), ban: t('activity.ban'), delete_account: t('activity.delete_account'),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('profile.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Identity */}
        <Section title={t('profile.identity')}>
          <div className="mb-4 flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt="" className="h-14 w-14 rounded-full border border-line object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-lg font-bold text-brand">{(name || user?.email || '?').slice(0, 1).toUpperCase()}</div>
            )}
            <label className="btn-ghost cursor-pointer text-xs">
              {t('profile.uploadAvatar')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadAvatar(e.target.files?.[0])} />
            </label>
          </div>
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('profile.fullName')}</label>
          <input className="input mb-3" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('profile.fullName')} />
          <label className="mb-1 block text-xs font-medium text-slate-600">{t('profile.avatarUrl')}</label>
          <input className="input mb-3" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          <button className="btn-primary" onClick={saveIdentity} disabled={savingId}>{savingId ? '…' : t('profile.save')}</button>
        </Section>

        {/* Plan */}
        <Section title={t('profile.plan')}>
          <div className="flex items-center gap-2">
            <Badge tone={plan === 'pro' ? 'brand' : 'gray'}>{plan === 'pro' ? 'MarketMax Pro' : 'Free'}</Badge>
            <Badge tone={role === 'super_admin' ? 'green' : 'gray'}>{role}</Badge>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {profile?.plan_expires_at ? t('profile.expires', { date: new Date(profile.plan_expires_at).toLocaleDateString() }) : t('profile.noExpiry')}
          </p>
          {profile?.stripe_customer_id && (
            <button
              className="btn-ghost mt-3"
              onClick={async () => {
                try {
                  await openBillingPortal()
                } catch (e) {
                  toast?.error(e.message || t('errors.generic'))
                }
              }}
            >
              {t('profile.manageSub')}
            </button>
          )}
        </Section>

        {/* Security */}
        <Section title={t('profile.security')}>
          {pwErr && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{pwErr}</p>}
          <input className="input mb-2" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder={t('profile.oldPassword')} autoComplete="current-password" />
          <input className="input mb-2" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder={t('profile.newPassword')} autoComplete="new-password" />
          <input className="input mb-3" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder={t('auth.confirmPassword')} autoComplete="new-password" />
          <button className="btn-primary" onClick={changePassword} disabled={pwBusy || !oldPw || !newPw}>{pwBusy ? '…' : t('profile.changePassword')}</button>
        </Section>

        {/* Activity */}
        <Section title={t('profile.activity')}>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-400">{t('profile.noActivity')}</p>
          ) : (
            <ul className="space-y-1.5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface2 px-3 py-1.5 text-xs">
                  <span className="font-medium text-slate-700">{ACTION_LABEL[a.action] || a.action}</span>
                  <span className="text-slate-400">{a.ip ? a.ip + ' · ' : ''}{timeAgo(new Date(a.created_at).getTime(), t)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Danger zone */}
      <div className="card border-red-200 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600">{t('profile.danger')}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">{t('profile.logoutAllDesc')}</p>
          <button className="btn-ghost shrink-0" onClick={logoutAll}>{t('profile.logoutAll')}</button>
        </div>
        <div className="mt-4 border-t border-line pt-4">
          {!delOpen ? (
            <button className="btn border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" onClick={() => setDelOpen(true)}>{t('profile.deleteAccount')}</button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-700">{t('profile.deleteWarn')}</p>
              <p className="text-xs text-slate-500">{t('profile.typeToConfirm', { word: 'SUPPRIMER' })}</p>
              <div className="flex gap-2">
                <input className="input max-w-[200px]" value={confirmDel} onChange={(e) => setConfirmDel(e.target.value)} placeholder="SUPPRIMER" />
                <button className="btn border border-red-300 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" disabled={confirmDel !== 'SUPPRIMER'} onClick={doDelete}>{t('profile.confirmDelete')}</button>
                <button className="btn-ghost" onClick={() => { setDelOpen(false); setConfirmDel('') }}>{t('common.clear')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
