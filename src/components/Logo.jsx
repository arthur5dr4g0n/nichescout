import { useTranslation } from 'react-i18next'

// MarketMax wordmark: "Market" deep blue + "Max" sky blue, with MM tile.
export default function Logo({ size = 'md', tagline = false, onDark = false }) {
  const { t } = useTranslation()
  const wordSize = size === 'lg' ? 'text-3xl' : 'text-lg'
  const tile = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9'
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/logo192.png"
        alt="MarketMax"
        className={`${tile} shrink-0 rounded-xl object-cover shadow-lg shadow-brand/30`}
      />
      <div>
        <p className={`font-bold leading-none ${wordSize}`} style={{ fontFamily: 'Inter, sans-serif' }}>
          <span style={{ color: '#1B4FD8' }}>Market</span>
          <span style={{ color: '#0EA5E9' }}>Max</span>
        </p>
        {tagline && <p className={`mt-1 text-[10px] ${onDark ? 'text-rail-muted' : 'text-slate-400'}`}>{t('brand.tagline')}</p>}
      </div>
    </div>
  )
}
