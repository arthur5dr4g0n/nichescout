import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireAuth({ children }) {
  const { user, loading, configured } = useAuth()
  const loc = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }
  // Guest mode (Supabase not configured): user is a guest -> allowed through.
  if (configured && !user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return children
}
