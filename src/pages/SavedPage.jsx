import { formatCurrency, formatCompact, formatNumber, formatRank } from '../utils/format'
import { downloadCSV } from '../utils/csv'
import { EmptyState, SectionTitle, RatingStars } from '../components/ui'
import NicheScoreCard from '../components/NicheScoreCard'
import { DownloadIcon, TrashIcon, ChartIcon } from '../components/icons'
import ProductImage from '../components/ProductImage'

export default function SavedPage({ saved, onOpenProduct }) {
  const items = saved.saved

  const exportCsv = () => {
    downloadCSV('saved-products.csv', items, [
      { key: 'asin', label: 'ASIN' },
      { key: 'title', label: 'Title' },
      { key: 'brand', label: 'Brand' },
      { key: 'category', label: 'Category' },
      { key: 'price', label: 'Price' },
      { key: 'bsr', label: 'BSR' },
      { key: 'sales', label: 'Est. Sales/mo' },
      { key: 'revenue', label: 'Est. Revenue/mo' },
      { key: 'reviews', label: 'Reviews' },
      { key: 'rating', label: 'Rating' },
      { key: 'sellers', label: 'Sellers' },
      { key: 'fbaFee', label: 'FBA Fee' },
    ])
  }

  if (!items.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Saved Products</h1>
          <p className="mt-1 text-sm text-slate-500">Your shortlist, stored locally in this browser.</p>
        </div>
        <EmptyState icon="🔖" title="No saved products yet" hint="Hit “Save” on any product from Search or Competitors to build your shortlist." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Saved Products</h1>
          <p className="mt-1 text-sm text-slate-500">{items.length} product{items.length > 1 ? 's' : ''} · stored in localStorage</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={exportCsv}>
            <DownloadIcon size={16} /> Export CSV
          </button>
          <button className="btn border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" onClick={saved.clear}>
            <TrashIcon size={16} /> Clear all
          </button>
        </div>
      </div>

      <div className="lg:max-w-md">
        <NicheScoreCard products={items} />
      </div>

      <div>
        <SectionTitle>Shortlist</SectionTitle>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">BSR</th>
                <th className="px-4 py-3 text-right">Sales/mo</th>
                <th className="px-4 py-3 text-right">Revenue/mo</th>
                <th className="px-4 py-3 text-right">Reviews</th>
                <th className="px-4 py-3 text-right">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.asin} className="border-b border-line last:border-0 hover:bg-surface2">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProductImage src={p.image} alt={p.title} className="h-9 w-9 shrink-0 rounded-lg border border-line" />
                      <div className="max-w-[220px]">
                        <p className="line-clamp-1 text-xs font-medium text-slate-800" title={p.title}>{p.title}</p>
                        <p className="font-mono text-[10px] text-slate-400">{p.asin}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-800">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatRank(p.bsr)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-brand">{formatCompact(p.sales)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-green-600">{formatCurrency(p.revenue)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(p.reviews)}</td>
                  <td className="px-4 py-3 text-right"><div className="flex justify-end"><RatingStars value={p.rating} /></div></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-surface2 hover:text-brand" onClick={() => onOpenProduct(p)} aria-label="Details">
                        <ChartIcon size={16} />
                      </button>
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => saved.remove(p.asin)} aria-label="Remove">
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
