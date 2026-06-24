import { useTranslation } from 'react-i18next'
import { LEGAL } from './legalContent'

export default function LegalPage({ doc }) {
  const { i18n, t } = useTranslation()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'fr'
  const content = LEGAL[doc]?.[lang]
  if (!content) return null

  return (
    <article className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">{content.title}</h1>
      <p className="mt-1 text-xs text-slate-400">{t('legal.updated', { date: content.updated })}</p>
      <div className="mt-6 space-y-5">
        {content.sections.map(([h, p], i) => (
          <section key={i}>
            <h2 className="text-sm font-semibold text-slate-800">{h}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{p}</p>
          </section>
        ))}
      </div>
    </article>
  )
}
