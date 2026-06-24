import { useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { usePlan } from './usePlan'
import { supabase } from '../lib/supabase'

const LKEY = 'marketmax.usage'
const todayUTC = () => new Date().toISOString().slice(0, 10) // resets at midnight UTC

// Daily search quota for free users. Stored in user_data (cloud) or localStorage
// (guest). Pro/admins are unlimited.
export function useSearchQuota() {
  const { user, configured } = useAuth()
  const { isPro, limits } = usePlan()
  const cloud = configured && user && !user.guest

  const consume = useCallback(async () => {
    if (isPro) return { allowed: true, remaining: Infinity }
    const today = todayUTC()

    if (cloud) {
      const { data } = await supabase.from('user_data').select('usage').eq('user_id', user.id).maybeSingle()
      let u = data?.usage && typeof data.usage === 'object' ? data.usage : {}
      if (u.date !== today) u = { date: today, search: 0 }
      if ((u.search || 0) >= limits.searchesPerDay) return { allowed: false, remaining: 0 }
      u.search = (u.search || 0) + 1
      await supabase.from('user_data').update({ usage: u }).eq('user_id', user.id)
      return { allowed: true, remaining: limits.searchesPerDay - u.search }
    }

    let u
    try {
      u = JSON.parse(localStorage.getItem(LKEY) || '{}')
    } catch {
      u = {}
    }
    if (u.date !== today) u = { date: today, search: 0 }
    if ((u.search || 0) >= limits.searchesPerDay) return { allowed: false, remaining: 0 }
    u.search = (u.search || 0) + 1
    localStorage.setItem(LKEY, JSON.stringify(u))
    return { allowed: true, remaining: limits.searchesPerDay - u.search }
  }, [isPro, cloud, user?.id, limits.searchesPerDay])

  return { consume, limit: limits.searchesPerDay }
}
