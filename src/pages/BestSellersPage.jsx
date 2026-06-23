import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchBestsellers, BS_CATEGORIES } from '../api/bestsellers'
import { useCachedResource } from '../hooks/useCachedResource'
import { useOnline } from '../hooks/useOnline'
import { useMetrics } from '../hooks/useMetrics'
import { TTL } from '../utils/cache'
import { formatCurrency, formatCompact, formatNumber, formatRank } from '../utils/format'
import { SkeletonTable, InfoTip, RatingStars } from '../components/ui'
import LastUpdated from '../components/LastUpdated'

export default function BestSellersPage() {
  const { t } = useTranslation()
  const METRICS = useMetrics()
  const [cat, setCat] = useState('electronics')
  const online = useOnline()
  const fetcher = useCallback(() => fetchBestsellers(cat), [cat])
  const { data, loading, source, updatedAt, refresh } = useCachedResource(`bestsellers.${cat}`, fetcher, 6 * TTL.hour)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('bestsellers.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('bestsellers.subtitle')}</p>
        </div>
        <LastUpdated source={source} updatedAt={updatedAt} loading={loading} onRefresh={refresh} online={online} />
      </div>

      <div className="flex flex-wrap gap-2">
        {BS_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`chip border px-3 py-1.5 ${cat === c.id ? 'border-brand bg-brand-tint text-brand' : 'border-line bg-surface text-slate-600 hover:border-brand/40'}`}>{c.label}</button>
        ))}
      </div>

      {loading && !data ? (
        <SkeletonTable rows={10} cols={6} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">{t('bestsellers.colProduct')}</th>
                <th className="px-4 py-3 text-right">{t('bestsellers.colPrice')}</th>
                <th className="px-4 py-3 text-right"><span className="inline-flex items-center gap-1">BSR <InfoTip text={METRICS.bsr} /></span></th>
                <th className="px-4 py-3 text-right"><span className="inline-flex items-center gap-1">{t('bestsellers.colSales')} <InfoTip text={METRICS.sales} /></span></th>
                <th className="px-4 py-3 text-right">{t('bestsellers.colReviews')}</th>
                <th className="px-4 py-3 text-right">{t('bestsellers.colRating')}</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((p) => (
                <tr key={p.asin} className="border-b border-line last:border-0 hover:bg-surface2">
                  <td className="px-4 py-3 font-semibold text-slate-400">{p.rank}</td>
                  <td className="px-4 py-3">
                    <a href={p.url} target={p.url?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block max-w-[280px]">
                      <p className="line-clamp-1 text-xs font-medium text-slate-800 hover:text-brand" title={p.title}>{p.title}</p>
                      <p className="font-mono text-[10px] text-slate-400">{p.asin}</p>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-800">{p.price != null ? formatCurrency(p.price) : '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatRank(p.bsr)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-brand">{formatCompact(p.sales)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{p.reviews != null ? formatNumber(p.reviews) : '—'}</td>
                  <td className="px-4 py-3 text-right">{p.rating != null ? <div className="flex justify-end"><RatingStars value={p.rating} /></div> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {source === 'mock' && <p className="text-xs text-slate-400">{t('bestsellers.mockNote')}</p>}
    </div>
  )
}
