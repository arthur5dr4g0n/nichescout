import { timeAgo } from '../utils/format'
import { TrendUpIcon, ExternalIcon } from './icons'

function Meta({ item, onRail }) {
  const muted = onRail ? 'text-rail-muted' : 'text-slate-400'
  return (
    <div className={`mt-1 flex items-center gap-2 text-[10px] ${muted}`}>
      <span>r/{item.sub}</span>
      {item.ups > 0 && <span className="inline-flex items-center gap-0.5"><TrendUpIcon size={11} /> {item.ups}</span>}
      {item.comments > 0 && <span>· {item.comments} cmt</span>}
      <span>· {timeAgo(item.created)}</span>
    </div>
  )
}

export default function BuzzFeed({ items, loading, compact = false, onRail = false, limit }) {
  const list = limit ? (items || []).slice(0, limit) : items || []

  if (loading && !list.length) {
    return (
      <div className="space-y-2">
        {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
          <div key={i} className={`h-10 rounded-md ${onRail ? 'animate-pulse bg-rail-hover' : 'skeleton'}`} />
        ))}
      </div>
    )
  }

  const titleColor = onRail ? 'text-slate-200' : 'text-slate-800'
  const hover = onRail ? 'hover:bg-rail-hover' : 'hover:bg-surface2'

  return (
    <ul className={compact ? 'space-y-1' : 'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
      {list.map((it) => (
        <li key={it.id}>
          <a
            href={it.url}
            target="_blank"
            rel="noreferrer"
            className={`group block rounded-lg px-2.5 py-2 transition-colors ${hover}`}
          >
            <p className={`line-clamp-2 text-xs font-medium ${titleColor}`}>
              {it.title}
              {!compact && <ExternalIcon size={11} className="ml-1 inline opacity-0 group-hover:opacity-60" />}
            </p>
            <Meta item={it} onRail={onRail} />
          </a>
        </li>
      ))}
    </ul>
  )
}
