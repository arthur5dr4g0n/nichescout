import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { fetchTrends } from '../api/trends'
import { TREND_CATEGORIES } from '../api/mockSignals'
import { useCachedResource } from '../hooks/useCachedResource'
import { useOnline } from '../hooks/useOnline'
import { TTL } from '../utils/cache'
import { formatCompact } from '../utils/format'
import { Badge, TrendBadge } from '../components/ui'
import LastUpdated from '../components/LastUpdated'
import TrendingChart from '../components/TrendingChart'

function Spark({ series, dir }) {
  const color = dir === 'up' ? '#16a34a' : dir === 'down' ? '#dc2626' : '#94a3b8'
  return (
    <ResponsiveContainer width={90} height={30}>
      <LineChart data={series.slice(-14)}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function TrendsPage() {
  const { t } = useTranslation()
  const online = useOnline()
  const fetcher = useCallback(() => fetchTrends('FR'), [])
  const { data, loading, source, updatedAt, refresh } = useCachedResource('trends.FR', fetcher, TTL.day)
  const [cat, setCat] = useState('Electronics')

  const keywords = data?.categories?.[cat] ? [...data.categories[cat]].sort((a, b) => b.momentum - a.momentum) : []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('trends.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('trends.subtitle')}</p>
        </div>
        <LastUpdated source={source} updatedAt={updatedAt} loading={loading} onRefresh={refresh} online={online} />
      </div>

      {loading && !data ? (
        <div className="card h-72 animate-pulse" />
      ) : (
        <>
          {data?.daily?.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {t('trends.daily')} {data.liveDaily ? <Badge tone="green" className="ml-1">{t('common.live')}</Badge> : <Badge tone="orange" className="ml-1">{t('trends.modeled')}</Badge>}
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.daily.map((d, i) => (
                  <span key={i} className="chip border border-line bg-canvas text-slate-700">
                    <span className="capitalize">{d.title}</span>
                    {d.traffic && <span className="text-slate-400">· {d.traffic}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          <TrendingChart trends={data} />

          <div className="flex flex-wrap gap-2">
            {TREND_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`chip border px-3 py-1.5 ${cat === c ? 'border-brand bg-brand-tint text-brand' : 'border-line bg-surface text-slate-600 hover:border-brand/40'}`}>{c}</button>
            ))}
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">{t('trends.colKeyword')}</th>
                  <th className="px-4 py-3 text-right">{t('trends.colMomentum')}</th>
                  <th className="px-4 py-3 text-right">{t('trends.colVolume')}</th>
                  <th className="px-4 py-3 text-center">{t('trends.colTrend')}</th>
                  <th className="px-4 py-3 text-right">{t('trends.col30')}</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((k) => (
                  <tr key={k.keyword} className="border-b border-line last:border-0 hover:bg-surface2">
                    <td className="px-4 py-3 font-medium capitalize text-slate-800">{k.keyword}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${k.direction === 'up' ? 'text-green-600' : k.direction === 'down' ? 'text-red-600' : 'text-slate-500'}`}>{k.momentum > 0 ? '+' : ''}{k.momentum}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatCompact(k.volume)}</td>
                    <td className="px-4 py-3"><div className="flex justify-center"><TrendBadge dir={k.direction} /></div></td>
                    <td className="px-4 py-3"><div className="flex justify-end"><Spark series={k.series} dir={k.direction} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">{t('trends.note')}</p>
        </>
      )}
    </div>
  )
}
