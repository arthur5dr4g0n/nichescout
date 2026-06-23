import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { getCompetitors } from '../api/amazon'
import { useAsync } from '../hooks/useAsync'
import { formatCompact, formatCurrency } from '../utils/format'
import { SearchBar, SkeletonTable, ErrorState, EmptyState, SectionTitle } from '../components/ui'
import { chartTooltipStyle } from '../components/ProductDetailModal'
import NicheScoreCard from '../components/NicheScoreCard'
import ComparisonTable from '../components/ComparisonTable'

function CompareChart({ products }) {
  const data = products.map((p, i) => ({
    name: `#${p.rank || i + 1}`,
    revenue: p.revenue,
    reviews: p.reviews,
  }))
  return (
    <div className="card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Revenue vs Reviews (competition map)</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={46} tickFormatter={(v) => formatCompact(v)} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={42} tickFormatter={(v) => formatCompact(v)} />
          <RTooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(15,23,42,0.04)' }} formatter={(v, n) => (n === 'revenue' ? formatCurrency(v) : v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="l" dataKey="revenue" name="Revenue/mo" fill="#16a34a" radius={[5, 5, 0, 0]} />
          <Bar yAxisId="r" dataKey="reviews" name="Reviews" fill="#1b4fd8" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function CompetitorsPage({ saved, onOpenProduct }) {
  const [asin, setAsin] = useState('')
  const { loading, error, data, ran, run } = useAsync(getCompetitors)

  const go = (q) => {
    const term = (q ?? asin).trim()
    if (!term) return
    setAsin(term)
    run(term)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Competitor Analysis</h1>
        <p className="mt-1 text-sm text-slate-500">Enter an ASIN to pull its top 10 competing products and compare them side by side.</p>
      </div>

      <SearchBar value={asin} onChange={setAsin} onSubmit={() => go()} loading={loading} placeholder="e.g. B0XXXXXXXX (any ASIN works in mock mode)" button="Analyze" />
      {!ran && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Try:</span>
          {['B08N5WRWNW', 'B07PXGQC1Q', 'B09JQMJHXY'].map((ex) => (
            <button key={ex} onClick={() => go(ex)} className="chip border border-line bg-surface font-mono text-slate-600 hover:border-brand/50 hover:text-brand">
              {ex}
            </button>
          ))}
        </div>
      )}

      {loading && <SkeletonTable rows={10} cols={8} />}
      {!loading && error && <ErrorState message={error} onRetry={() => go()} />}
      {!loading && !error && !ran && <EmptyState icon="🥊" title="Size up the competition" hint="Paste an ASIN to see who you'd be up against and how strong they are." />}

      {!loading && !error && data?.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <NicheScoreCard products={data} />
            <CompareChart products={data} />
          </div>

          <div>
            <SectionTitle hint="Click any row to open full details.">Top {data.length} competitors</SectionTitle>
            <ComparisonTable products={data} isSaved={saved.has} onToggleSave={saved.toggle} onOpen={onOpenProduct} />
          </div>
        </div>
      )}
    </div>
  )
}
