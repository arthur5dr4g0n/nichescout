import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ProductDetailModal from './components/ProductDetailModal'
import DashboardPage from './pages/DashboardPage'
import SearchPage from './pages/SearchPage'
import KeywordsPage from './pages/KeywordsPage'
import CompetitorsPage from './pages/CompetitorsPage'
import TrendsPage from './pages/TrendsPage'
import BestSellersPage from './pages/BestSellersPage'
import SavedPage from './pages/SavedPage'
import KanbanPage from './pages/KanbanPage'
import AssistantPage from './pages/AssistantPage'
import { useSavedProducts } from './hooks/useSavedProducts'
import { useKanban } from './hooks/useKanban'
import { useOnline } from './hooks/useOnline'
import { MenuIcon } from './components/icons'

const TITLES = {
  dashboard: 'Dashboard',
  search: 'Search',
  keywords: 'Keywords',
  competitors: 'Competitors',
  trends: 'Trends',
  bestsellers: 'Best Sellers',
  saved: 'Saved Products',
  kanban: 'Research Board',
  assistant: 'AI Assistant',
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const saved = useSavedProducts()
  const kanban = useKanban()
  const online = useOnline()

  const navigate = (v) => {
    setView(v)
    setSidebarOpen(false)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        active={view}
        onNavigate={navigate}
        savedCount={saved.saved.length}
        boardCount={kanban.count}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {!online && (
          <div className="bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
            ⚠ You're offline — showing cached / mock data.
          </div>
        )}

        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <button className="text-slate-600" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <MenuIcon />
          </button>
          <span className="text-sm font-semibold text-slate-900">NicheScout · {TITLES[view]}</span>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {view === 'dashboard' && <DashboardPage kanban={kanban} onNavigate={navigate} />}
          {view === 'search' && <SearchPage saved={saved} onOpenProduct={setSelected} />}
          {view === 'keywords' && <KeywordsPage />}
          {view === 'competitors' && <CompetitorsPage saved={saved} onOpenProduct={setSelected} />}
          {view === 'trends' && <TrendsPage />}
          {view === 'bestsellers' && <BestSellersPage />}
          {view === 'saved' && <SavedPage saved={saved} onOpenProduct={setSelected} />}
          {view === 'kanban' && <KanbanPage kanban={kanban} />}
          {view === 'assistant' && <AssistantPage />}
        </main>
      </div>

      {selected && (
        <ProductDetailModal
          product={selected}
          onClose={() => setSelected(null)}
          saved={saved.has(selected.asin)}
          onToggleSave={saved.toggle}
        />
      )}
    </div>
  )
}
