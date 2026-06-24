import { useCallback, useMemo } from 'react'
import { useOutletContext, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePlan } from '../hooks/usePlan'
import { useUpgrade } from '../components/Upgrade'
import { fetchTrends } from '../api/trends'
import { fetchReddit } from '../api/reddit'
import { useCachedResource } from '../hooks/useCachedResource'
import { useOnline } from '../hooks/useOnline'
import { useToast } from '../components/Toast'
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

export default function DashboardPage() {
  const { kanban } = useOutletContext()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const online = useOnline()
  const { isFree, limits } = usePlan()
  const { promptUpgrade } = useUpgrade()
  const trendsFetcher = useCallback(() => fetchTrends('FR'), [])
  const redditFetcher = useCallback(() => fetchReddit(), [])
  const trends = useCachedResource('trends.FR', trendsFetcher, TTL.day)
  const reddit = useCachedResource('reddit', redditFetcher, TTL.hour)

  const hot = useMemo(() => computeHotNiches(trends.data, reddit.data), [trends.data, reddit.data])
  const loadingHot = (trends.loading && !trends.data) || (reddit.loading && !reddit.data)
  const topNiche = hot[0]
  const rising = hot.filter((n) => n.direction === 'up').length

  const onAdd = (n) => {
    if (kanban.nicheSet.has(n.niche?.toLowerCase())) {
      toast?.info(t('toast.boardExists'))
      return
    }
    if (isFree && kanban.count >= limits.kanbanCards) {
      toast?.info(t('pro.kanbanLimit', { n: limits.kanbanCards }))
      promptUpgrade()
      return
    }
    kanban.addCard({ niche: n.niche, score: n.score, color: n.color, category: n.category })
    toast?.success(t('toast.boardAdded'))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('dashboard.subtitle')}</p>
        </div>
        {!online && <span className="chip border border-amber-200 bg-amber-50 text-amber-700">⚠ {t('offline.banner')}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t('dashboard.kpiHottest')} value={topNiche ? topNiche.score : '—'} sub={topNiche?.niche} accent={topNiche?.color === 'green' ? 'text-green-600' : topNiche?.color === 'red' ? 'text-red-600' : 'text-amber-600'} />
        <Kpi label={t('dashboard.kpiRising')} value={rising} sub={t('dashboard.kpiRisingSub')} accent="text-green-600" />
        <Kpi label={t('dashboard.kpiReddit')} value={reddit.data ? formatCompact(reddit.data.length) : '—'} sub={t('dashboard.kpiRedditSub')} />
        <Kpi label={t('dashboard.kpiBoard')} value={kanban.count} sub={t('dashboard.kpiBoardSub')} accent="text-brand" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle>{t('dashboard.hotToday')}</SectionTitle>
          <LastUpdated source={trends.source} updatedAt={Math.min(trends.updatedAt || Infinity, reddit.updatedAt || Infinity)} loading={loadingHot} onRefresh={() => { trends.refresh(); reddit.refresh() }} online={online} />
        </div>
        {loadingHot ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-52 animate-pulse" />)}
          </div>
        ) : (
          <>
            <HotNiches niches={isFree ? hot.slice(0, limits.hotNiches) : hot} onAdd={onAdd} addedSet={kanban.nicheSet} />
            {isFree && hot.length > limits.hotNiches && (
              <Link to="/pricing" className="mt-3 block rounded-xl border border-dashed border-brand/40 bg-brand-tint p-3 text-center text-sm font-semibold text-brand hover:opacity-80">
                🔒 {t('pro.moreNiches', { n: hot.length - limits.hotNiches })}
              </Link>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendingChart trends={trends.data} />
        </div>
        <div className="card flex flex-col p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('dashboard.redditBuzz')}</h2>
            <button onClick={() => navigate('/trends')} className="text-xs text-brand hover:underline">{t('dashboard.trendsLink')}</button>
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
