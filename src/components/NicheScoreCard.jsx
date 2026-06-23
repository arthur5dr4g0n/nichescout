import { useMemo } from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { nicheScore } from '../utils/estimates'
import { formatCurrency, formatNumber } from '../utils/format'
import { METRICS } from '../utils/metrics'
import { InfoTip } from './ui'

const COLORS = {
  green: '#16a34a',
  orange: '#f59e0b',
  red: '#dc2626',
  gray: '#94a3b8',
}

function Criterion({ label, ok, detail, score }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface2 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={ok ? 'text-green-600' : 'text-slate-400'}>{ok ? '✓' : '○'}</span>
        <div>
          <p className="text-xs font-medium text-slate-800">{label}</p>
          <p className="text-[11px] text-slate-500">{detail}</p>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-500">{score}/100</span>
    </div>
  )
}

export default function NicheScoreCard({ products }) {
  const result = useMemo(() => nicheScore(products), [products])
  const { score, color, label, breakdown } = result
  const fill = COLORS[color] || COLORS.gray

  if (!breakdown) return null

  const data = [{ name: 'score', value: score, fill }]

  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center gap-1.5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Niche Score</h2>
        <InfoTip text={METRICS.niche} />
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: '#e5e7eb' }} dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: fill }}>
              {score}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: fill }}>
              {label}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <Criterion
            label="Low competition"
            detail={`Avg ${formatNumber(breakdown.avgReviews)} reviews — aim for < 200`}
            ok={breakdown.avgReviews < 200}
            score={breakdown.reviewScore}
          />
          <Criterion
            label="Profitable demand"
            detail={`Avg ${formatCurrency(breakdown.avgRevenue)}/mo — aim for > $5,000`}
            ok={breakdown.avgRevenue > 5000}
            score={breakdown.revenueScore}
          />
          <Criterion
            label="Price sweet-spot"
            detail={`Avg ${formatCurrency(breakdown.avgPrice)} — ideal $15–$70`}
            ok={breakdown.avgPrice >= 15 && breakdown.avgPrice <= 70}
            score={breakdown.priceScore}
          />
        </div>
      </div>
    </div>
  )
}
