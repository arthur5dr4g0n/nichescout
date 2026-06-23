import { timeAgo } from '../utils/format'

// Source/freshness badge shown on every async data block.
export default function LastUpdated({ source, updatedAt, loading, onRefresh, online = true }) {
  const tone =
    source === 'live' ? 'text-green-600' : source === 'mock' ? 'text-amber-600' : 'text-slate-400'
  const label = source === 'live' ? 'Live' : source === 'mock' ? 'Mock' : 'Cached'

  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-400">
      {!online && <span className="chip border border-amber-200 bg-amber-50 text-amber-700">Offline</span>}
      <span className={`inline-flex items-center gap-1 font-medium ${tone}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${source === 'live' ? 'bg-green-500' : source === 'mock' ? 'bg-amber-400' : 'bg-slate-300'}`} />
        {label}
      </span>
      <span>·</span>
      <span>{loading ? 'updating…' : `updated ${timeAgo(updatedAt)}`}</span>
      {onRefresh && (
        <button onClick={onRefresh} disabled={loading} className="ml-1 text-brand hover:underline disabled:opacity-50">
          refresh
        </button>
      )}
    </div>
  )
}
