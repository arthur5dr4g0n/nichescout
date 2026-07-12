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

// Same as tryLive but sends the Supabase access token — required by the
// authed proxies (/api/rapid, /api/keywords) that guard paid API quotas.
export async function tryLiveAuthed(path, opts = {}) {
  const { supabase } = await import('../lib/supabase')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return tryLive(path, {
    ...opts,
    headers: { Authorization: `Bearer ${session?.access_token || ''}`, ...(opts.headers || {}) },
  })
}
