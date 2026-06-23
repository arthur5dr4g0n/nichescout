import { useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency, formatCompact, formatNumber, formatRank } from '../utils/format'
import { estimateMargin } from '../utils/estimates'
import { METRICS } from '../utils/metrics'
import { Stat, RatingStars, Badge } from './ui'
import { XIcon, BookmarkIcon, BookmarkFilledIcon, ExternalIcon } from './icons'
import ProductImage from './ProductImage'

export const chartTooltipStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  fontSize: 12,
  color: '#0f172a',
  boxShadow: '0 10px 30px -10px rgb(15 23 42 / 0.25)',
}

function MiniChart({ title, data, color, formatter }) {
  if (!data?.length) {
    return (
      <div className="card flex h-44 items-center justify-center p-4 text-xs text-slate-400">
        Trend history not available in real-API mode.
      </div>
    )
  }
  return (
    <div className="card p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={formatter} />
          <RTooltip contentStyle={chartTooltipStyle} formatter={(v) => formatter(v)} labelStyle={{ color: '#64748b' }} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function ProductDetailModal({ product, onClose, saved, onToggleSave }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!product) return null
  const p = product
  const margin = estimateMargin(p.price)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div className="card my-auto w-full max-w-3xl animate-fadein p-5 shadow-pop sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start gap-4">
          <ProductImage src={p.image} alt={p.title} className="h-24 w-24 shrink-0 rounded-xl border border-line" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-snug text-slate-900">{p.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-slate-400">{p.asin}</span>
              {p.brand && p.brand !== '—' && <Badge tone="gray">{p.brand}</Badge>}
              {p.category && p.category !== 'default' && <Badge tone="brand">{p.category}</Badge>}
            </div>
            <div className="mt-2">
              <RatingStars value={p.rating} />
            </div>
          </div>
          <button className="btn-ghost !px-2" onClick={onClose} aria-label="Close">
            <XIcon />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Price" value={formatCurrency(p.price)} hint={METRICS.price} />
          <Stat label="BSR" value={formatRank(p.bsr)} hint={METRICS.bsr} />
          <Stat label="Sales/mo" value={formatCompact(p.sales)} hint={METRICS.sales} accent="text-brand" />
          <Stat label="Revenue/mo" value={formatCurrency(p.revenue)} hint={METRICS.revenue} accent="text-green-600" />
          <Stat label="Reviews" value={formatNumber(p.reviews)} hint={METRICS.reviews} />
          <Stat label="Sellers" value={p.sellers} hint={METRICS.sellers} />
          <Stat label="FBA fee" value={formatCurrency(p.fbaFee)} hint={METRICS.fba} accent="text-red-600" />
          <Stat label="Est. margin" value={`${margin.toFixed(0)}%`} accent={margin > 30 ? 'text-green-600' : 'text-amber-600'} sub="after FBA" />
        </div>

        {p.fbaBreakdown && (
          <div className="mb-4 rounded-xl bg-surface2 p-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">FBA breakdown:</span>{' '}
            Referral {formatCurrency(p.fbaBreakdown.referral)} + Fulfillment {formatCurrency(p.fbaBreakdown.fulfillment)} ={' '}
            <span className="font-semibold text-red-600">{formatCurrency(p.fbaBreakdown.total)}</span> / unit
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniChart title="BSR trend (12 mo)" data={p.bsrHistory} color="#3b6fe0" formatter={(v) => formatRank(v)} />
          <MiniChart title="Revenue trend (12 mo)" data={p.revenueHistory} color="#16a34a" formatter={(v) => formatCurrency(v)} />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            className={`btn flex-1 border ${
              saved ? 'border-brand bg-brand-tint text-brand' : 'border-line bg-surface text-slate-600 hover:bg-surface2'
            }`}
            onClick={() => onToggleSave(p)}
          >
            {saved ? <BookmarkFilledIcon size={16} /> : <BookmarkIcon size={16} />}
            {saved ? 'Saved to list' : 'Save product'}
          </button>
          {p.url && p.url !== '#' && (
            <a className="btn-ghost" href={p.url} target="_blank" rel="noreferrer">
              <ExternalIcon size={16} /> View on Amazon
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
