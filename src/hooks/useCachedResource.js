import { useCallback, useEffect, useState } from 'react'
import { getCache, setCache, isFresh } from '../utils/cache'

// Loads a resource through a localStorage TTL cache with auto-refresh.
// `fetcher` must resolve to { data, source } where source is 'live' | 'mock'.
// On error it falls back to any cached copy, then to the fetcher's own mock.
export function useCachedResource(key, fetcher, ttlMs, { auto = true } = {}) {
  const [state, setState] = useState(() => {
    const c = getCache(key)
    return c
      ? { data: c.data, source: c.source, updatedAt: c.ts, loading: false, error: null }
      : { data: null, source: null, updatedAt: null, loading: true, error: null }
  })

  const load = useCallback(
    async (force) => {
      const cached = getCache(key)
      if (!force && cached && isFresh(cached.ts, ttlMs)) {
        setState({ data: cached.data, source: cached.source, updatedAt: cached.ts, loading: false, error: null })
        return
      }
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const { data, source } = await fetcher()
        const ts = Date.now()
        setCache(key, { data, source, ts })
        setState({ data, source, updatedAt: ts, loading: false, error: null })
      } catch (err) {
        const fallback = getCache(key)
        if (fallback) {
          setState({ data: fallback.data, source: fallback.source, updatedAt: fallback.ts, loading: false, error: null })
        } else {
          setState((s) => ({ ...s, loading: false, error: err?.message || 'Failed to load.' }))
        }
      }
    },
    [key, ttlMs, fetcher],
  )

  useEffect(() => {
    load(false)
  }, [load])

  useEffect(() => {
    if (!auto) return
    const id = setInterval(() => load(true), ttlMs)
    return () => clearInterval(id)
  }, [auto, ttlMs, load])

  return { ...state, refresh: () => load(true) }
}
