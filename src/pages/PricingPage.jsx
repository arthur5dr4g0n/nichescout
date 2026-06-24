import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../hooks/usePlan'
import { useToast } from '../components/Toast'
import { startCheckout, openBillingPortal, STRIPE_ENABLED } from '../lib/stripe'
import { Badge } from '../components/ui'

function Mark({ v }) {
  if (v === true) return <span className="text-green-600">✅</span>
  if (v === false) return <span className="text-slate-300">❌</span>
  return <span className="font-medium text-slate-700">{v}</span>
}

export default function PricingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { isPro } = usePlan()
  const [billing, setBilling] = useState('monthly')
  const [busy, setBusy] = useState(false)

  const features = [
    { label: t('pricing.fNiches'), free: '3', pro: '∞' },
    { label: t('pricing.fSearches'), free: '5/j', pro: '∞' },
    { label: t('pricing.fCsv'), free: false, pro: true },
    { label: t('pricing.fAi'), free: false, pro: true },
    { label: t('pricing.fTrends'), free: '7j', pro: '30j' },
    { label: t('pricing.fSupport'), free: false, pro: true },
  ]
  const faq = t('pricing.faq', { returnObjects: true })

  const goPro = async () => {
    if (!STRIPE_ENABLED) return toast?.info(t('pricing.comingSoon'))
    setBusy(true)
    try {
      await startCheckout(billing)
    } catch (e) {
      setBusy(false)
      toast?.error(e.message || t('errors.generic'))
    }
  }
  const manage = async () => {
    try {
      await openBillingPortal()
    } catch (e) {
      toast?.error(e.message || t('errors.generic'))
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('pricing.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('pricing.subtitle')}</p>
        {/* Monthly / Yearly toggle */}
        <div className="mt-4 inline-flex rounded-xl border border-line bg-surface p-1">
          {['monthly', 'yearly'].map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${billing === b ? 'bg-brand text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t(`pricing.${b}`)}
              {b === 'yearly' && <span className="ml-1 text-[10px] font-bold text-green-600">{t('pricing.yearlySave')}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Free */}
        <div className="card flex flex-col p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{t('pricing.free')}</h2>
            {!isPro && <Badge tone="gray">{t('pricing.current')}</Badge>}
          </div>
          <p className="mt-1 text-3xl font-bold text-slate-900">0€</p>
          <ul className="mt-4 flex-1 space-y-2.5 text-sm">
            {features.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="text-slate-600">{f.label}</span> <Mark v={f.free} />
              </li>
            ))}
          </ul>
          <button className="btn-ghost mt-5 w-full" onClick={() => navigate('/')}>{t('pricing.continueFree')}</button>
        </div>

        {/* Pro */}
        <div className="card flex flex-col p-6 ring-2 ring-brand">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">MarketMax Pro</h2>
            {isPro && <Badge tone="brand">{t('pricing.current')}</Badge>}
          </div>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {billing === 'yearly' ? '249€' : '29€'}
            <span className="text-base font-medium text-slate-400">{billing === 'yearly' ? t('pricing.perYear') : t('pricing.perMonth')}</span>
          </p>
          <ul className="mt-4 flex-1 space-y-2.5 text-sm">
            {features.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="text-slate-600">{f.label}</span> <Mark v={f.pro} />
              </li>
            ))}
          </ul>
          {isPro ? (
            <button className="btn-primary mt-5 w-full" onClick={manage}>{t('profile.manageSub')}</button>
          ) : (
            <>
              <button className="btn-primary mt-5 w-full" onClick={goPro} disabled={busy}>
                {busy ? '…' : t('pricing.startTrial')}
              </button>
              <p className="mt-2 text-center text-xs font-medium text-green-600">{t('pricing.trial')}</p>
            </>
          )}
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">{t('pricing.secure')}</p>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{t('pricing.faqTitle')}</h2>
        <div className="space-y-2">
          {(Array.isArray(faq) ? faq : []).map((item, i) => (
            <details key={i} className="card group p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">{item.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
