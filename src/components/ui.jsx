import { useState } from 'react'
import { InfoIcon, StarIcon, TrendUpIcon, TrendDownIcon, TrendFlatIcon, SearchIcon } from './icons'

// --- Tooltip / metric explainer ---------------------------------------------
export function InfoTip({ text, className = '' }) {
  const [open, setOpen] = useState(false)
  return (
    <span className={`relative inline-flex group align-middle ${className}`}>
      <button
        type="button"
        aria-label="More info"
        onClick={() => setOpen((o) => !o)}
        onMouseLeave={() => setOpen(false)}
        className="text-slate-400 hover:text-brand focus:outline-none"
      >
        <InfoIcon size={14} />
      </button>
      <span
        role="tooltip"
        className={`absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2
                    text-xs font-normal normal-case leading-relaxed tracking-normal text-slate-100 shadow-pop transition-opacity duration-150
                    ${open ? 'opacity-100' : 'pointer-events-none opacity-0'} group-hover:opacity-100`}
      >
        {text}
      </span>
    </span>
  )
}

// --- Labeled stat with optional tooltip -------------------------------------
export function Stat({ label, value, hint, accent = 'text-slate-900', sub }) {
  return (
    <div className="flex flex-col">
      <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
        {hint && <InfoTip text={hint} />}
      </span>
      <span className={`text-sm font-semibold ${accent}`}>{value}</span>
      {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
    </div>
  )
}

// --- Badges ------------------------------------------------------------------
export function Badge({ children, tone = 'brand', className = '' }) {
  const tones = {
    brand: 'bg-brand-tint text-brand border-brand/20',
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  return <span className={`chip border ${tones[tone] || tones.gray} ${className}`}>{children}</span>
}

export function CompetitionBadge({ level }) {
  const tone = level === 'Low' ? 'green' : level === 'High' ? 'red' : 'orange'
  return <Badge tone={tone}>{level}</Badge>
}

export function TrendBadge({ dir }) {
  if (dir === 'up') return <span className="inline-flex items-center gap-1 text-green-600"><TrendUpIcon size={16} /> Rising</span>
  if (dir === 'down') return <span className="inline-flex items-center gap-1 text-red-600"><TrendDownIcon size={16} /> Falling</span>
  return <span className="inline-flex items-center gap-1 text-slate-500"><TrendFlatIcon size={16} /> Flat</span>
}

export function RatingStars({ value = 0 }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} size={13} filled={i <= Math.round(value)} className={i <= Math.round(value) ? 'text-amber-400' : 'text-slate-300'} />
      ))}
      <span className="ml-1 text-xs text-slate-500">{value ? value.toFixed(1) : '—'}</span>
    </span>
  )
}

// --- Loading / error / empty states -----------------------------------------
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="card p-4">
      <div className="mb-3 flex gap-3">
        <Skeleton className="h-20 w-20 rounded-xl" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 8, cols = 6 }) {
  return (
    <div className="card overflow-hidden">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-line px-4 py-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">⚠️</div>
      <p className="max-w-md text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button className="btn-ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon = '🔍', title, hint }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-tint text-3xl">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
    </div>
  )
}

// --- Search bar --------------------------------------------------------------
export function SearchBar({ value, onChange, onSubmit, placeholder, loading, button = 'Search' }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      <button type="submit" className="btn-primary sm:w-auto" disabled={loading || !value.trim()}>
        {loading ? 'Loading…' : button}
      </button>
    </form>
  )
}

export function SectionTitle({ children, hint }) {
  return (
    <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
      {children}
      {hint && <InfoTip text={hint} />}
    </h2>
  )
}
