import { formatCurrency, formatCompact, formatNumber, formatRank } from '../utils/format'
import { useMetrics } from '../hooks/useMetrics'
import { InfoTip, RatingStars } from './ui'
import { BookmarkIcon, BookmarkFilledIcon } from './icons'
import ProductImage from './ProductImage'

function Th({ children, hint, right }) {
  return (
    <th className={`whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 ${right ? 'text-right' : 'text-left'}`}>
      <span className="inline-flex items-center gap-1">
        {children}
        {hint && <InfoTip text={hint} />}
      </span>
    </th>
  )
}

export default function ComparisonTable({ products, isSaved, onToggleSave, onOpen }) {
  const METRICS = useMetrics()
  const maxRevenue = Math.max(...products.map((p) => p.revenue || 0))
  const minBsr = Math.min(...products.filter((p) => p.bsr).map((p) => p.bsr))

  return (
    <div className="card overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            <Th>#</Th>
            <Th>Product</Th>
            <Th right hint={METRICS.price}>Price</Th>
            <Th right hint={METRICS.bsr}>BSR</Th>
            <Th right hint={METRICS.sales}>Sales/mo</Th>
            <Th right hint={METRICS.revenue}>Revenue/mo</Th>
            <Th right hint={METRICS.reviews}>Reviews</Th>
            <Th right hint={METRICS.rating}>Rating</Th>
            <Th right hint={METRICS.sellers}>Sellers</Th>
            <Th right hint={METRICS.fba}>FBA</Th>
            <Th right>Save</Th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => {
            const isRevLeader = p.revenue === maxRevenue && maxRevenue > 0
            const isBsrLeader = p.bsr === minBsr && p.bsr
            return (
              <tr
                key={p.asin}
                className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-surface2"
                onClick={() => onOpen(p)}
              >
                <td className="px-3 py-2.5 text-slate-400">{p.rank || i + 1}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <ProductImage src={p.image} alt={p.title} className="h-9 w-9 shrink-0 rounded-lg border border-line" />
                    <div className="max-w-[200px]">
                      <p className="line-clamp-1 text-xs font-medium text-slate-800" title={p.title}>{p.title}</p>
                      <p className="font-mono text-[10px] text-slate-400">{p.asin}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-800">{formatCurrency(p.price)}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${isBsrLeader ? 'font-semibold text-green-600' : 'text-slate-600'}`}>
                  {formatRank(p.bsr)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-brand">{formatCompact(p.sales)}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${isRevLeader ? 'font-semibold text-green-600' : 'text-slate-800'}`}>
                  {formatCurrency(p.revenue)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(p.reviews)}</td>
                <td className="px-3 py-2.5 text-right"><div className="flex justify-end"><RatingStars value={p.rating} /></div></td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{p.sellers}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-red-600">{formatCurrency(p.fbaFee)}</td>
                <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`rounded-lg p-1.5 ${isSaved(p.asin) ? 'text-brand' : 'text-slate-400 hover:text-slate-700'}`}
                    onClick={() => onToggleSave(p)}
                    aria-label="Save"
                  >
                    {isSaved(p.asin) ? <BookmarkFilledIcon size={16} /> : <BookmarkIcon size={16} />}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
