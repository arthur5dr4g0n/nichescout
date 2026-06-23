// Display formatting helpers.

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

export const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

export function formatCurrency(n, currency = 'USD') {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n)
}

// 12345 -> "12.3K", 2_300_000 -> "2.3M"
export function formatCompact(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

export function formatRank(n) {
  if (!n) return '—'
  return '#' + new Intl.NumberFormat('en-US').format(n)
}

export function timeAgo(ts, t) {
  if (!ts || !Number.isFinite(ts)) return '—'
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (s < 45) return t ? t('common.justNow') : 'just now'
  if (s < 3600) return t ? t('common.minAgo', { n: Math.floor(s / 60) }) : `${Math.floor(s / 60)}m ago`
  if (s < 86400) return t ? t('common.hAgo', { n: Math.floor(s / 3600) }) : `${Math.floor(s / 3600)}h ago`
  return t ? t('common.dAgo', { n: Math.floor(s / 86400) }) : `${Math.floor(s / 86400)}d ago`
}
