import { Outlet, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '../components/Logo'
import LanguageToggle from '../components/LanguageToggle'

export default function LegalLayout() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/"><Logo /></Link>
          <LanguageToggle />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
        <nav className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <Link className="hover:text-brand" to="/cgu">{t('legal.cgu')}</Link>
          <Link className="hover:text-brand" to="/confidentialite">{t('legal.privacy')}</Link>
          <Link className="hover:text-brand" to="/cookies">{t('legal.cookies')}</Link>
          <Link className="ml-auto font-medium text-brand hover:underline" to="/">{t('legal.backApp')}</Link>
        </nav>
      </main>
    </div>
  )
}
