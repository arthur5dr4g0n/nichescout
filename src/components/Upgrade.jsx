import { createContext, useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'

const UpgradeCtx = createContext({ isPro: true, gate: () => true })
export const useUpgrade = () => useContext(UpgradeCtx)

export function UpgradeProvider({ children }) {
  const { plan, role } = useAuth()
  const isPro = plan === 'pro' || role === 'admin' || role === 'super_admin'
  const [open, setOpen] = useState(false)

  // Returns true if allowed; otherwise opens the upgrade modal and returns false.
  const gate = () => {
    if (isPro) return true
    setOpen(true)
    return false
  }

  return (
    <UpgradeCtx.Provider value={{ isPro, gate }}>
      {children}
      {open && <UpgradeModal onClose={() => setOpen(false)} />}
    </UpgradeCtx.Provider>
  )
}

function UpgradeModal({ onClose }) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-sm animate-fadein p-6 text-center shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint text-2xl">🔒</div>
        <h2 className="text-lg font-bold text-slate-900">{t('upgrade.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('upgrade.body')}</p>
        <Link to="/pricing" onClick={onClose} className="btn-primary mt-4 w-full">{t('upgrade.cta')}</Link>
        <button onClick={onClose} className="mt-2 text-xs text-slate-400 hover:text-slate-600">{t('upgrade.later')}</button>
      </div>
    </div>
  )
}
