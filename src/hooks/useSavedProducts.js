import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ensureRow, fetchUserData, saveColumn } from '../lib/userData'

const KEY = 'nichescout.saved.v1'

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Saved-products list. Synced to Supabase when signed in, else localStorage.
export function useSavedProducts() {
  const { user, configured } = useAuth()
  const cloud = configured && user && !user.guest
  const [saved, setSaved] = useState(() => (cloud ? [] : loadLocal()))
  const [ready, setReady] = useState(!cloud)

  useEffect(() => {
    let active = true
    if (!cloud) {
      setSaved(loadLocal())
      setReady(true)
      return
    }
    setReady(false)
    ;(async () => {
      await ensureRow(user.id)
      const d = await fetchUserData(user.id)
      if (active) {
        setSaved(Array.isArray(d.saved) ? d.saved : [])
        setReady(true)
      }
    })()
    return () => {
      active = false
    }
  }, [cloud, user?.id])

  useEffect(() => {
    if (!ready) return
    if (cloud) saveColumn(user.id, { saved })
    else {
      try {
        localStorage.setItem(KEY, JSON.stringify(saved))
      } catch {
        /* ignore */
      }
    }
  }, [saved, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  const has = useCallback((asin) => saved.some((p) => p.asin === asin), [saved])

  const toggle = useCallback((product) => {
    setSaved((list) =>
      list.some((p) => p.asin === product.asin)
        ? list.filter((p) => p.asin !== product.asin)
        : [...list, { ...product, savedAt: Date.now() }],
    )
  }, [])

  const remove = useCallback((asin) => setSaved((list) => list.filter((p) => p.asin !== asin)), [])
  const clear = useCallback(() => setSaved([]), [])

  return { saved, has, toggle, remove, clear, syncing: cloud && !ready }
}
