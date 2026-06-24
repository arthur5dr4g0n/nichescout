import { useAuth } from '../auth/AuthProvider'

// Free-plan limits (admins/super_admins and Pro bypass everything).
export const LIMITS = {
  searchesPerDay: 5,
  kanbanCards: 5,
  hotNiches: 3,
  trendsDays: 7,
}

export function usePlan() {
  const { plan, role } = useAuth()
  const isPro = plan === 'pro' || role === 'admin' || role === 'super_admin'
  return { plan: plan || 'free', isPro, isFree: !isPro, limits: LIMITS }
}
