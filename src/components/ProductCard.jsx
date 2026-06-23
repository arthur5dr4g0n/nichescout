import { formatCurrency, formatCompact, formatNumber, formatRank } from '../utils/format'
import { METRICS } from '../utils/metrics'
import { Stat, RatingStars, Badge } from './ui'
import { BookmarkIcon, BookmarkFilledIcon, ChartIcon } from './icons'
import ProductImage from './ProductImage'

export default function ProductCard({ product, saved, onToggleSave, onOpen }) {
  const p = product
  return (
    <div className="card animate-fadein flex flex-col p-4 transition-shadow hover:shadow-pop">
      <div className="mb-3 flex gap-3">
        <ProductImage src={p.image} alt={p.title} className="h-20 w-20 shrink-0 rounded-xl border border-line" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900" title={p.title}>
            {p.title}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-400">{p.asin}</span>
            {p.category && p.category !== 'default' && <Badge tone="brand">{p.category}</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-3">
        <Stat label="Price" value={formatCurrency(p.price)} hint={METRICS.price} />
        <Stat label="BSR" value={formatRank(p.bsr)} hint={METRICS.bsr} sub={p.bsrEstimated ? 'n/a in search' : undefined} />
        <Stat label="Sales/mo" value={formatCompact(p.sales)} hint={METRICS.sales} accent="text-brand" />
        <Stat label="Revenue/mo" value={formatCurrency(p.revenue)} hint={METRICS.revenue} accent="text-green-600" />
        <Stat label="Reviews" value={formatNumber(p.reviews)} hint={METRICS.reviews} />
        <Stat label="Sellers" value={p.sellers} hint={METRICS.sellers} />
        <Stat label="FBA fee" value={formatCurrency(p.fbaFee)} hint={METRICS.fba} accent="text-red-600" />
        <div className="col-span-2 flex flex-col">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Rating</span>
          <RatingStars value={p.rating} />
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-line pt-3">
        <button className="btn-ghost flex-1" onClick={() => onOpen(p)}>
          <ChartIcon size={16} /> Details
        </button>
        <button
          className={`btn flex-1 border ${
            saved ? 'border-brand bg-brand-tint text-brand' : 'border-line bg-surface text-slate-600 hover:bg-surface2'
          }`}
          onClick={() => onToggleSave(p)}
        >
          {saved ? <BookmarkFilledIcon size={16} /> : <BookmarkIcon size={16} />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
