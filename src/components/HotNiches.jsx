import { formatCompact } from '../utils/format'
import { Badge } from './ui'
import { TrendUpIcon, TrendDownIcon, TrendFlatIcon } from './icons'

const SCORE_STYLES = {
  green: 'bg-green-50 text-green-700 ring-green-200',
  orange: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
}

function Dir({ dir, momentum }) {
  if (dir === 'up') return <span className="inline-flex items-center gap-1 text-green-600"><TrendUpIcon size={15} /> +{momentum}%</span>
  if (dir === 'down') return <span className="inline-flex items-center gap-1 text-red-600"><TrendDownIcon size={15} /> {momentum}%</span>
  return <span className="inline-flex items-center gap-1 text-slate-400"><TrendFlatIcon size={15} /> {momentum}%</span>
}

function SignalBar({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
        <div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function HotNiches({ niches, onAdd, addedSet }) {
  if (!niches?.length) return null
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {niches.map((n) => (
        <div key={n.niche} className="card flex flex-col p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold capitalize text-slate-900" title={n.niche}>{n.niche}</p>
              <Badge tone="gray" className="mt-1">{n.category}</Badge>
            </div>
            <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ring-1 ${SCORE_STYLES[n.color]}`}>
              <span className="text-lg font-bold leading-none">{n.score}</span>
              <span className="text-[8px] uppercase tracking-wide">score</span>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between text-xs">
            <Dir dir={n.direction} momentum={n.momentum} />
            <span className="text-slate-400">{formatCompact(n.volume)} vol</span>
          </div>

          <div className="mb-3 space-y-1.5">
            <SignalBar label="Trend" value={n.signals.trend} />
            <SignalBar label="Buzz" value={n.signals.buzz} />
            <SignalBar label="Open" value={n.signals.competition} />
          </div>

          <ul className="mb-3 flex-1 space-y-1">
            {n.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-300" /> {r}
              </li>
            ))}
          </ul>

          {onAdd && (
            <button
              onClick={() => onAdd(n)}
              disabled={addedSet?.has(n.niche)}
              className="btn-ghost w-full text-xs disabled:opacity-60"
            >
              {addedSet?.has(n.niche) ? '✓ On board' : '+ Add to Kanban'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
