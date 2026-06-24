import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePlan } from '../hooks/usePlan'

// Wrap any Pro-only content. Free users see it blurred behind a 🔒 overlay.
export default function ProGate({ children, title }) {
  const { isPro } = usePlan()
  const { t } = useTranslation()
  if (isPro) return children
  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="pointer-events-none select-none blur-sm" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/50 p-4 text-center backdrop-blur-[1px]">
        <span className="text-3xl">🔒</span>
        <p className="text-sm font-semibold text-slate-800">{title || t('upgrade.title')}</p>
        <Link to="/pricing" className="btn-primary mt-1 text-xs">
          {t('progate.unlock')}
        </Link>
      </div>
    </div>
  )
}
