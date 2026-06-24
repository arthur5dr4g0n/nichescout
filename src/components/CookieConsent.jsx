import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const KEY = 'marketmax.cookies'

export default function CookieConsent() {
  const { t } = useTranslation()
  const [done, setDone] = useState(() => Boolean(localStorage.getItem(KEY)))
  if (done) return null
  const choose = (v) => {
    localStorage.setItem(KEY, v)
    setDone(true)
  }
  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-2xl rounded-xl border border-line bg-surface p-4 shadow-pop">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-xs text-slate-600">
          🍪 {t('cookies.banner')}{' '}
          <Link to="/cookies" className="font-medium text-brand hover:underline">{t('cookies.learn')}</Link>
        </p>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs" onClick={() => choose('declined')}>{t('cookies.decline')}</button>
          <button className="btn-primary text-xs" onClick={() => choose('accepted')}>{t('cookies.accept')}</button>
        </div>
      </div>
    </div>
  )
}
