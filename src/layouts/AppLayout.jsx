import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from '../components/Sidebar'
import ProductDetailModal from '../components/ProductDetailModal'
import Logo from '../components/Logo'
import { useSavedProducts } from '../hooks/useSavedProducts'
import { useKanban } from '../hooks/useKanban'
import { useOnline } from '../hooks/useOnline'
import { usePlan } from '../hooks/usePlan'
import { useToast } from '../components/Toast'
import { UpgradeProvider } from '../components/Upgrade'
import { MenuIcon } from '../components/icons'

export default function AppLayout() {
  const { t } = useTranslation()
  const toast = useToast()
  const { isFree } = usePlan()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const saved = useSavedProducts()
  const kanban = useKanban()
  const online = useOnline()

  const toggleSave = (p) => {
    const was = saved.has(p.asin)
    saved.toggle(p)
    was ? toast?.info(t('toast.removed')) : toast?.success(t('toast.saved'))
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        savedCount={saved.saved.length}
        boardCount={kanban.count}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {!online && (
          <div className="bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
            ⚠ {t('offline.banner')}
          </div>
        )}
        {isFree && (
          <Link to="/pricing" className="block bg-brand py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-brand-dark">
            🔒 {t('pro.banner')}
          </Link>
        )}

        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <button className="text-slate-600" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <MenuIcon />
          </button>
          <Logo />
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <UpgradeProvider>
            <Outlet context={{ saved, kanban, openProduct: setSelected }} />
          </UpgradeProvider>
        </main>
      </div>

      {selected && (
        <ProductDetailModal
          product={selected}
          onClose={() => setSelected(null)}
          saved={saved.has(selected.asin)}
          onToggleSave={toggleSave}
        />
      )}
    </div>
  )
}
