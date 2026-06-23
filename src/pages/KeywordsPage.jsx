import { useState } from 'react'
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, Cell } from 'recharts'
import { keywordResearch } from '../api/keywords'
import { useAsync } from '../hooks/useAsync'
import { formatNumber, formatCompact, formatCurrency } from '../utils/format'
import { downloadCSV } from '../utils/csv'
import { METRICS } from '../utils/metrics'
import { SearchBar, SkeletonTable, ErrorState, EmptyState, CompetitionBadge, TrendBadge, InfoTip } from '../components/ui'
import { chartTooltipStyle } from '../components/ProductDetailModal'
import { DownloadIcon } from '../components/icons'

function Sparkline({ data, dir }) {
  const color = dir === 'up' ? '#16a34a' : dir === 'down' ? '#dc2626' : '#94a3b8'
  return (
    <ResponsiveContainer width={70} height={28}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function VolumeChart({ rows }) {
  const data = rows.slice(0, 10).map((r) => ({ name: r.keyword.length > 16 ? r.keyword.slice(0, 15) + '…' : r.keyword, volume: r.volume }))
  return (
    <div className="card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Top keywords by search volume</h2>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
          <RTooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(15,23,42,0.04)' }} formatter={(v) => formatNumber(v)} />
          <Bar dataKey="volume" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#16a34a' : '#1b4fd8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function KeywordsPage() {
  const [seed, setSeed] = useState('')
  const { loading, error, data, ran, run } = useAsync(keywordResearch)

  const go = (q) => {
    const term = (q ?? seed).trim()
    if (!term) return
    setSeed(term)
    run(term)
  }

  const exportCsv = () => {
    downloadCSV(`keywords-${seed || 'export'}.csv`, data, [
      { key: 'keyword', label: 'Keyword' },
      { key: 'volume', label: 'Search Volume' },
      { key: 'competition', label: 'Competition' },
      { key: 'cpc', label: 'CPC (USD)' },
      { key: 'trend', label: 'Trend' },
    ])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Keyword Research</h1>
        <p className="mt-1 text-sm text-slate-500">Enter a seed keyword to discover related terms, demand and ad cost.</p>
      </div>

      <SearchBar value={seed} onChange={setSeed} onSubmit={() => go()} loading={loading} placeholder="e.g. water bottle" button="Research" />

      {loading && <SkeletonTable rows={9} cols={5} />}
      {!loading && error && <ErrorState message={error} onRetry={() => go()} />}
      {!loading && !error && !ran && <EmptyState icon="🔑" title="Find keyword ideas" hint="Enter a seed keyword to pull related terms with volume, CPC and competition." />}

      {!loading && !error && data?.length > 0 && (
        <div className="space-y-6">
          <VolumeChart rows={data} />

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{data.length} related keywords</h2>
            <button className="btn-ghost" onClick={exportCsv}>
              <DownloadIcon size={16} /> Export CSV
            </button>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Keyword</th>
                  <th className="px-4 py-3 text-right"><span className="inline-flex items-center gap-1">Volume <InfoTip text={METRICS.volume} /></span></th>
                  <th className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1">Competition <InfoTip text={METRICS.competition} /></span></th>
                  <th className="px-4 py-3 text-right"><span className="inline-flex items-center gap-1">CPC <InfoTip text={METRICS.cpc} /></span></th>
                  <th className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1">Trend <InfoTip text={METRICS.trend} /></span></th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.keyword} className="border-b border-line last:border-0 hover:bg-surface2">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.keyword}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-800">{formatNumber(row.volume)}</td>
                    <td className="px-4 py-3 text-center"><CompetitionBadge level={row.competition} /></td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-600">{formatCurrency(row.cpc)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Sparkline data={row.spark} dir={row.trend} />
                        <TrendBadge dir={row.trend} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
