import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { chartTooltipStyle } from './ProductDetailModal'
import { InfoTip } from './ui'

const LINE_COLORS = ['#1b4fd8', '#16a34a', '#d97706', '#7c3aed', '#0ea5e9']

// trends: { categories: { Cat: [{keyword, series:[{day,value}], momentum}] } }
export default function TrendingChart({ trends }) {
  const [range, setRange] = useState(30)

  const { merged, keys } = useMemo(() => {
    const all = trends?.categories ? Object.values(trends.categories).flat() : []
    const top = [...all].sort((a, b) => b.momentum - a.momentum).slice(0, 4)
    const days = range
    const merged = Array.from({ length: days }, (_, i) => {
      const idx = 30 - days + i
      const row = { day: `D${i + 1}` }
      top.forEach((t) => (row[t.keyword] = t.series[idx]?.value ?? null))
      return row
    })
    return { merged, keys: top.map((t) => t.keyword) }
  }, [trends, range])

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Top rising niches
          <InfoTip text="Search-interest index (0–100) for the fastest-rising niches. Daily searches are live; the curves are modeled trend lines." />
        </h2>
        <div className="flex rounded-lg border border-line bg-surface p-0.5">
          {[7, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                range === r ? 'bg-brand text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={merged} margin={{ top: 6, right: 10, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
          <RTooltip contentStyle={chartTooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {keys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
