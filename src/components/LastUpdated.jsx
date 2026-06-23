import { useTranslation } from 'react-i18next'
import { timeAgo } from '../utils/format'

// Source/freshness badge shown on every async data block.
export default function LastUpdated({ source, updatedAt, loading, onRefresh, online = true }) {
  const { t } = useTranslation()
  const tone = source === 'live' ? 'text-green-600' : source === 'mock' ? 'text-amber-600' : 'text-slate-400'
  const label = source === 'live' ? t('common.live') : source === 'mock' ? t('common.mock') : t('common.cached')

  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-400">
      {!online && <span className="chip border border-amber-200 bg-amber-50 text-amber-700">⚠</span>}
      <span className={`inline-flex items-center gap-1 font-medium ${tone}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${source === 'live' ? 'bg-green-500' : source === 'mock' ? 'bg-amber-400' : 'bg-slate-300'}`} />
        {label}
      </span>
      <span>·</span>
      <span>{loading ? t('common.updating') : t('common.updatedAgo', { time: timeAgo(updatedAt, t) })}</span>
      {onRefresh && (
        <button onClick={onRefresh} disabled={loading} className="ml-1 text-brand hover:underline disabled:opacity-50">
          {t('common.refresh')}
        </button>
      )}
    </div>
  )
}
