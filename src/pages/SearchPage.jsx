import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { searchProducts } from '../api/amazon'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../components/Toast'
import { formatCurrency, formatCompact } from '../utils/format'
import { SearchBar, SkeletonGrid, ErrorState, EmptyState, SectionTitle } from '../components/ui'
import { chartTooltipStyle } from '../components/ProductDetailModal'
import NicheScoreCard from '../components/NicheScoreCard'
import ProductCard from '../components/ProductCard'

const EXAMPLES = ['garlic press', 'yoga mat', 'led desk lamp', 'dog nail grinder', 'reusable straws']

function RevenueChart({ products, title }) {
  const data = [...products]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((p) => ({ name: p.title.split(' ').slice(0, 2).join(' '), revenue: p.revenue }))
  return (
    <div className="card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <ResponsiveContainer width="100%" height={186}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={42} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={46} tickFormatter={(v) => formatCompact(v)} />
          <RTooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(15,23,42,0.04)' }} formatter={(v) => formatCurrency(v)} />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#16a34a' : '#1b4fd8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function SearchPage() {
  const { saved, openProduct } = useOutletContext()
  const { t } = useTranslation()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const { loading, error, data, ran, run } = useAsync(searchProducts)

  const go = (q) => {
    const term = (q ?? query).trim()
    if (!term) return
    setQuery(term)
    run(term)
  }

  const toggleSave = (p) => {
    const was = saved.has(p.asin)
    saved.toggle(p)
    was ? toast?.info(t('toast.removed')) : toast?.success(t('toast.saved'))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('search.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('search.subtitle')}</p>
      </div>

      <SearchBar value={query} onChange={setQuery} onSubmit={() => go()} loading={loading} placeholder={t('search.placeholder')} button={t('common.search')} />

      {!ran && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">{t('search.try')}</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => go(ex)} className="chip border border-line bg-surface text-slate-600 hover:border-brand/50 hover:text-brand">
              {ex}
            </button>
          ))}
        </div>
      )}

      {loading && <SkeletonGrid count={8} />}
      {!loading && error && <ErrorState message={error} onRetry={() => go()} />}
      {!loading && !error && ran && data?.length === 0 && <EmptyState title={t('search.noResults')} hint={t('search.noResultsHint')} />}
      {!loading && !error && !ran && <EmptyState icon="🛒" title={t('search.emptyTitle')} hint={t('search.emptyHint')} />}

      {!loading && !error && data?.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <NicheScoreCard products={data} />
            <RevenueChart products={data} title={t('search.topRevenue')} />
          </div>

          <div>
            <SectionTitle>{t('search.results', { n: data.length, q: query })}</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {data.map((p) => (
                <ProductCard key={p.asin} product={p} saved={saved.has(p.asin)} onToggleSave={toggleSave} onOpen={openProduct} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
