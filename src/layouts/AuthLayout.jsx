import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import Logo from '../components/Logo'
import LanguageToggle from '../components/LanguageToggle'

export default function AuthLayout() {
  const { user, configured, loading } = useAuth()
  if (loading) return null
  // No Supabase -> no accounts; already signed in -> straight to the app.
  if (!configured || user) return <Navigate to="/" replace />

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <div className="mb-6">
        <Logo size="lg" tagline />
      </div>
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
