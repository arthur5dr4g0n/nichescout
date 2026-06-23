import { useTranslation } from 'react-i18next'
import { setLang } from '../i18n'
import { useToast } from './Toast'

export default function LanguageToggle({ onDark = false }) {
  const { i18n, t } = useTranslation()
  const toast = useToast()
  const cur = i18n.language?.startsWith('en') ? 'en' : 'fr'

  const change = (lng) => {
    if (lng === cur) return
    setLang(lng)
    toast?.info(t('toast.langChanged'))
  }

  const base = 'rounded-md px-2 py-0.5 text-xs font-semibold transition-colors'
  const active = onDark ? 'bg-rail-hover text-white' : 'bg-brand text-white'
  const idle = onDark ? 'text-rail-muted hover:text-white' : 'text-slate-500 hover:text-slate-800'

  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg p-0.5 ${onDark ? 'bg-black/20' : 'bg-surface2'}`}>
      <button className={`${base} ${cur === 'fr' ? active : idle}`} onClick={() => change('fr')}>🇫🇷 FR</button>
      <button className={`${base} ${cur === 'en' ? active : idle}`} onClick={() => change('en')}>🇬🇧 EN</button>
    </div>
  )
}
