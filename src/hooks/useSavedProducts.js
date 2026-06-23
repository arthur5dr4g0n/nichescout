import { useCallback, useEffect, useState } from 'react'

const KEY = 'nichescout.saved.v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Saved-products list backed by localStorage, shared across the app.
export function useSavedProducts() {
  const [saved, setSaved] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved))
    } catch {
      /* storage full or blocked — ignore */
    }
  }, [saved])

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

  return { saved, has, toggle, remove, clear }
}
