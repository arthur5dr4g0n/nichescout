import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '../components/Toast'
import { Badge } from '../components/ui'

function Plan({ name, price, features, current, highlight, cta, onCta }) {
  return (
    <div className={`card flex flex-col p-6 ${highlight ? 'ring-2 ring-brand' : ''}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{name}</h2>
        {current && <Badge tone="brand">{current}</Badge>}
      </div>
      <p className="mt-1 text-3xl font-bold text-slate-900">{price}</p>
      <ul className="mt-4 flex-1 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="mt-0.5 text-green-600">✓</span> {f}
          </li>
        ))}
      </ul>
      {cta && (
        <button onClick={onCta} className={highlight ? 'btn-primary mt-5 w-full' : 'btn-ghost mt-5 w-full'}>
          {cta}
        </button>
      )}
    </div>
  )
}

export default function PricingPage() {
  const { t } = useTranslation()
  const { plan, role } = useAuth()
  const toast = useToast()
  const isPro = plan === 'pro' || role === 'admin' || role === 'super_admin'

  const freeFeatures = t('pricing.freeFeatures', { returnObjects: true })
  const proFeatures = t('pricing.proFeatures', { returnObjects: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('pricing.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('pricing.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:max-w-3xl">
        <Plan
          name={t('pricing.free')}
          price="0€"
          features={Array.isArray(freeFeatures) ? freeFeatures : []}
          current={!isPro ? t('pricing.current') : null}
        />
        <Plan
          name="MarketMax Pro"
          price={t('pricing.proPrice')}
          features={Array.isArray(proFeatures) ? proFeatures : []}
          current={isPro ? t('pricing.current') : null}
          highlight
          cta={isPro ? null : t('pricing.choose')}
          onCta={() => toast?.info(t('pricing.comingSoon'))}
        />
      </div>

      <p className="text-xs text-slate-400">{t('pricing.note')}</p>
    </div>
  )
}
