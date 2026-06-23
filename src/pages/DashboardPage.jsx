import { useCallback, useMemo } from 'react'
import { fetchTrends } from '../api/trends'
import { fetchReddit } from '../api/reddit'
import { useCachedResource } from '../hooks/useCachedResource'
import { useOnline } from '../hooks/useOnline'
import { TTL } from '../utils/cache'
import { computeHotNiches } from '../utils/hotNiches'
import { formatCompact } from '../utils/format'
import { SectionTitle } from '../components/ui'
import LastUpdated from '../components/LastUpdated'
import HotNiches from '../components/HotNiches'
import TrendingChart from '../components/TrendingChart'
import BuzzFeed from '../components/BuzzFeed'

function Kpi({ label, value, sub, accent = 'text-slate-900' }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

export default function DashboardPage({ kanban, onNavigate }) {
  const online = useOnline()
  const trendsFetcher = useCallback(() => fetchTrends('FR'), [])
  const redditFetcher = useCallback(() => fetchReddit(), [])
  const trends = useCachedResource('trends.FR', trendsFetcher, TTL.day)
  const reddit = useCachedResource('reddit', redditFetcher, TTL.hour)

  const hot = useMemo(() => computeHotNiches(trends.data, reddit.data), [trends.data, reddit.data])
  const loadingHot = (trends.loading && !trends.data) || (reddit.loading && !reddit.data)

  const topNiche = hot[0]
  const rising = hot.filter((n) => n.direction === 'up').length

  const onAdd = (n) => kanban.addCard({ niche: n.niche, score: n.score, color: n.color, category: n.category })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">What's hot right now — from Google Trends + Reddit, scored automatically.</p>
        </div>
        {!online && <span className="chip border border-amber-200 bg-amber-50 text-amber-700">⚠ Offline — showing cached / mock data</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Hottest niche" value={topNiche ? topNiche.score : '—'} sub={topNiche?.niche} accent={topNiche?.color === 'green' ? 'text-green-600' : topNiche?.color === 'red' ? 'text-red-600' : 'text-amber-600'} />
        <Kpi label="Rising niches" value={rising} sub="trending up (7d)" accent="text-green-600" />
        <Kpi label="Reddit posts" value={reddit.data ? formatCompact(reddit.data.length) : '—'} sub="FBA buzz tracked" />
        <Kpi label="On your board" value={kanban.count} sub="niches saved" accent="text-brand" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle>🔥 Hot Niches Today</SectionTitle>
          <LastUpdated source={trends.source} updatedAt={Math.min(trends.updatedAt || Infinity, reddit.updatedAt || Infinity)} loading={loadingHot} onRefresh={() => { trends.refresh(); reddit.refresh() }} online={online} />
        </div>
        {loadingHot ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-52 animate-pulse" />)}
          </div>
        ) : (
          <HotNiches niches={hot} onAdd={onAdd} addedSet={kanban.nicheSet} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendingChart trends={trends.data} />
        </div>
        <div className="card flex flex-col p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reddit buzz</h2>
            <button onClick={() => onNavigate?.('trends')} className="text-xs text-brand hover:underline">Trends →</button>
          </div>
          <LastUpdated source={reddit.source} updatedAt={reddit.updatedAt} loading={reddit.loading} onRefresh={reddit.refresh} online={online} />
          <div className="mt-3 flex-1 overflow-y-auto" style={{ maxHeight: 320 }}>
            <BuzzFeed items={reddit.data} loading={reddit.loading} compact limit={10} />
          </div>
        </div>
      </div>
    </div>
  )
}
