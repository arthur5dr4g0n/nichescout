import { useCallback } from 'react'
import { USE_MOCK } from '../config'
import { fetchReddit } from '../api/reddit'
import { useCachedResource } from '../hooks/useCachedResource'
import { TTL } from '../utils/cache'
import {
  GridIcon, SearchIcon, KeyIcon, UsersIcon, TrendUpIcon, FlameIcon, BookmarkIcon, BoardIcon, SparkIcon, ChartIcon, XIcon,
} from './icons'
import BuzzFeed from './BuzzFeed'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: GridIcon, desc: 'Hot niches today' },
  { id: 'search', label: 'Search', Icon: SearchIcon, desc: 'Find & analyze' },
  { id: 'keywords', label: 'Keywords', Icon: KeyIcon, desc: 'Volume, CPC, trends' },
  { id: 'competitors', label: 'Competitors', Icon: UsersIcon, desc: 'Compare top 10' },
  { id: 'trends', label: 'Trends', Icon: TrendUpIcon, desc: 'Rising & declining' },
  { id: 'bestsellers', label: 'Best Sellers', Icon: FlameIcon, desc: 'Top by category' },
  { id: 'saved', label: 'Saved', Icon: BookmarkIcon, desc: 'Your shortlist' },
  { id: 'kanban', label: 'Research Board', Icon: BoardIcon, desc: 'Kanban pipeline' },
  { id: 'assistant', label: 'AI Assistant', Icon: SparkIcon, desc: 'Factual FBA Q&A' },
]

export default function Sidebar({ active, onNavigate, savedCount, boardCount, open, onClose }) {
  const redditFetcher = useCallback(() => fetchReddit(), [])
  const reddit = useCachedResource('reddit', redditFetcher, TTL.hour)

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-rail transition-transform
                    lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-soft to-brand-dark text-white shadow-lg shadow-brand/30">
              <ChartIcon size={20} />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-white">NicheScout</p>
              <p className="text-[10px] uppercase tracking-widest text-rail-muted">Product Research</p>
            </div>
          </div>
          <button className="text-rail-muted hover:text-white lg:hidden" onClick={onClose} aria-label="Close menu">
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          <nav className="space-y-0.5">
            {NAV.map(({ id, label, Icon, desc }) => {
              const isActive = active === id
              const badge = id === 'saved' ? savedCount : id === 'kanban' ? boardCount : 0
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    isActive ? 'bg-rail-hover text-white' : 'text-slate-300 hover:bg-rail-hover/60 hover:text-white'
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r bg-brand-soft" style={{ width: 3 }} />}
                  <span className={isActive ? 'text-brand-soft' : 'text-rail-muted group-hover:text-slate-200'}>
                    <Icon size={19} />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {label}
                      {badge > 0 && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
                    </span>
                    <span className="text-[10px] text-rail-muted">{desc}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="mt-5 border-t border-rail-line pt-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-rail-muted">🔥 FBA Buzz</span>
              <span className={`h-1.5 w-1.5 rounded-full ${reddit.source === 'live' ? 'bg-green-500' : 'bg-amber-400'}`} title={reddit.source === 'live' ? 'Live from Reddit' : 'Mock data'} />
            </div>
            <BuzzFeed items={reddit.data} loading={reddit.loading} compact onRail limit={4} />
          </div>
        </div>

        <div className="m-3 rounded-lg border border-rail-line bg-black/20 p-3">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${USE_MOCK ? 'bg-amber-400' : 'bg-green-500'}`} />
            <span className="text-xs font-medium text-slate-200">{USE_MOCK ? 'Mock data mode' : 'Live API mode'}</span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-rail-muted">
            Free sources auto-switch to live when they respond. Paid APIs need keys in <span className="font-mono">.env</span>.
          </p>
        </div>
      </aside>
    </>
  )
}
