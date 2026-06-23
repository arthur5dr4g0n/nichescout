// Shared helper to call the local dev proxy (/api/*) with a fast timeout and a
// quick offline short-circuit, so callers can cleanly fall back to mock data.
export async function tryLive(path, opts = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('offline')
  }
  const r = await fetch(path, { signal: AbortSignal.timeout(opts.timeout || 7000), ...opts })
  if (!r.ok) {
    const j = await r.json().catch(() => ({}))
    throw new Error(j.error || `http_${r.status}`)
  }
  return r.json()
}
