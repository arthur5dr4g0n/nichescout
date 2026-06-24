import { useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from './Toast'
import { fetchReddit } from '../api/reddit'
import { useCachedResource } from '../hooks/useCachedResource'
import { TTL } from '../utils/cache'
import { GridIcon, SearchIcon, KeyIcon, UsersIcon, TrendUpIcon, FlameIcon, BookmarkIcon, BoardIcon, SparkIcon, XIcon } from './icons'
import Logo from './Logo'
import LanguageToggle from './LanguageToggle'
import BuzzFeed from './BuzzFeed'

const NAV = [
  { to: '/', key: 'dashboard', Icon: GridIcon },
  { to: '/search', key: 'search', Icon: SearchIcon },
  { to: '/keywords', key: 'keywords', Icon: KeyIcon },
  { to: '/competitors', key: 'competitors', Icon: UsersIcon },
  { to: '/trends', key: 'trends', Icon: TrendUpIcon },
  { to: '/bestsellers', key: 'bestsellers', Icon: FlameIcon },
  { to: '/saved', key: 'saved', Icon: BookmarkIcon, badge: 'saved' },
  { to: '/board', key: 'board', Icon: BoardIcon, badge: 'board' },
  { to: '/assistant', key: 'assistant', Icon: SparkIcon },
]

export default function Sidebar({ savedCount, boardCount, open, onClose }) {
  const { t } = useTranslation()
  const { user, configured, signOut, profile, role } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const redditFetcher = useCallback(() => fetchReddit(), [])
  const reddit = useCachedResource('reddit', redditFetcher, TTL.hour)

  const logout = async () => {
    await signOut()
    toast?.success(t('auth.loggedOut'))
    navigate('/login')
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-rail transition-transform
                    lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo onDark tagline />
          <button className="text-rail-muted hover:text-white lg:hidden" onClick={onClose} aria-label="Close menu">
            <XIcon />
          </button>
        </div>

        <div className="px-4 pb-2">
          <LanguageToggle onDark />
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          <nav className="space-y-0.5">
            {NAV.map(({ to, key, Icon, badge }) => {
              const badgeCount = badge === 'saved' ? savedCount : badge === 'board' ? boardCount : 0
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      isActive ? 'bg-rail-hover text-white' : 'text-slate-300 hover:bg-rail-hover/60 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r bg-brand-soft" style={{ width: 3 }} />}
                      <span className={isActive ? 'text-brand-soft' : 'text-rail-muted group-hover:text-slate-200'}>
                        <Icon size={19} />
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {t(`nav.${key}`)}
                          {badgeCount > 0 && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{badgeCount}</span>}
                        </span>
                        <span className="text-[10px] text-rail-muted">{t(`nav.${key}Desc`)}</span>
                      </span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-5 border-t border-rail-line pt-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-rail-muted">{t('nav.buzz')}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${reddit.source === 'live' ? 'bg-green-500' : 'bg-amber-400'}`}
                title={reddit.source === 'live' ? 'Live' : 'Mock'}
              />
            </div>
            <BuzzFeed items={reddit.data} loading={reddit.loading} compact onRail limit={4} />
          </div>
        </div>

        <div className="m-3 space-y-2">
          {configured && user && !user.guest ? (
            <>
              <NavLink
                to="/profile"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg border border-rail-line p-2 transition-colors ${isActive ? 'bg-rail-hover' : 'bg-black/20 hover:bg-rail-hover/60'}`
                }
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/40 text-xs font-bold text-white">{(user.email || '?').slice(0, 1).toUpperCase()}</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">{profile?.full_name || user.email}</p>
                  <p className="truncate text-[10px] text-rail-muted">{role !== 'user' ? role : t('nav.profile')}</p>
                </div>
              </NavLink>
              <button onClick={logout} className="w-full rounded-md bg-rail-hover px-2 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-white">
                {t('common.logout')}
              </button>
            </>
          ) : (
            <div className="rounded-lg border border-rail-line bg-black/20 p-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs font-medium text-slate-200">{t('common.guest')}</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
