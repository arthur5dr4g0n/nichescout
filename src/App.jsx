import { Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import LegalLayout from './layouts/LegalLayout'
import CookieConsent from './components/CookieConsent'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import LegalPage from './pages/legal/LegalPage'
import DashboardPage from './pages/DashboardPage'
import SearchPage from './pages/SearchPage'
import KeywordsPage from './pages/KeywordsPage'
import CompetitorsPage from './pages/CompetitorsPage'
import TrendsPage from './pages/TrendsPage'
import BestSellersPage from './pages/BestSellersPage'
import SavedPage from './pages/SavedPage'
import KanbanPage from './pages/KanbanPage'
import AssistantPage from './pages/AssistantPage'
import ProfilePage from './pages/ProfilePage'
import AuthCallback from './pages/AuthCallback'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route element={<LegalLayout />}>
          <Route path="/cgu" element={<LegalPage doc="cgu" />} />
          <Route path="/confidentialite" element={<LegalPage doc="confidentialite" />} />
          <Route path="/cookies" element={<LegalPage doc="cookies" />} />
        </Route>

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/keywords" element={<KeywordsPage />} />
          <Route path="/competitors" element={<CompetitorsPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/bestsellers" element={<BestSellersPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/board" element={<KanbanPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsent />
    </>
  )
}
