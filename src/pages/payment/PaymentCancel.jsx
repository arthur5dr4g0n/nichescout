import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '../../components/Logo'

export default function PaymentCancel() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
      <Logo size="lg" />
      <div className="text-5xl">🙂</div>
      <h1 className="text-xl font-bold text-slate-900">{t('payment.cancelTitle')}</h1>
      <p className="max-w-sm text-sm text-slate-500">{t('payment.cancelBody')}</p>
      <Link to="/pricing" className="btn-primary mt-1">{t('payment.backToPricing')}</Link>
    </div>
  )
}
