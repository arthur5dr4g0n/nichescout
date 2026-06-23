import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ensureRow, fetchUserData, saveColumn } from '../lib/userData'

const KEY = 'nichescout.kanban.v1'

// id stays stable; labels are translated in the UI via kanban.col.<id>.
export const COLUMNS = [
  { id: 'analyser', emoji: '🔍' },
  { id: 'encours', emoji: '⚡' },
  { id: 'validee', emoji: '✅' },
  { id: 'abandonnee', emoji: '❌' },
]

const empty = () => ({ analyser: [], encours: [], validee: [], abandonnee: [] })

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty()
  } catch {
    return empty()
  }
}

export function useKanban() {
  const { user, configured } = useAuth()
  const cloud = configured && user && !user.guest
  const [board, setBoard] = useState(() => (cloud ? empty() : loadLocal()))
  const [ready, setReady] = useState(!cloud)
  const firstWrite = useRef(true)

  useEffect(() => {
    let active = true
    if (!cloud) {
      setBoard(loadLocal())
      setReady(true)
      return
    }
    setReady(false)
    firstWrite.current = true
    ;(async () => {
      await ensureRow(user.id)
      const d = await fetchUserData(user.id)
      if (active) {
        setBoard(d.board && typeof d.board === 'object' ? { ...empty(), ...d.board } : empty())
        setReady(true)
      }
    })()
    return () => {
      active = false
    }
  }, [cloud, user?.id])

  useEffect(() => {
    if (!ready) return
    if (cloud) saveColumn(user.id, { board })
    else {
      try {
        localStorage.setItem(KEY, JSON.stringify(board))
      } catch {
        /* ignore */
      }
    }
  }, [board, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  const addCard = useCallback((card, col = 'analyser') => {
    setBoard((b) => {
      const exists = Object.values(b).flat().some((c) => c.niche?.toLowerCase() === card.niche?.toLowerCase())
      if (exists) return b
      const entry = {
        id: 'k' + Date.now() + Math.random().toString(36).slice(2, 6),
        niche: card.niche,
        score: card.score ?? null,
        color: card.color ?? 'gray',
        category: card.category ?? '',
        notes: card.notes ?? '',
        date: Date.now(),
      }
      return { ...b, [col]: [entry, ...b[col]] }
    })
  }, [])

  const moveCard = useCallback((id, toCol) => {
    setBoard((b) => {
      let moved = null
      const next = {}
      for (const col of Object.keys(b)) {
        next[col] = b[col].filter((c) => {
          if (c.id === id) {
            moved = c
            return false
          }
          return true
        })
      }
      if (moved) next[toCol] = [moved, ...next[toCol]]
      return next
    })
  }, [])

  const updateCard = useCallback((id, patch) => {
    setBoard((b) => {
      const next = {}
      for (const col of Object.keys(b)) next[col] = b[col].map((c) => (c.id === id ? { ...c, ...patch } : c))
      return next
    })
  }, [])

  const removeCard = useCallback((id) => {
    setBoard((b) => {
      const next = {}
      for (const col of Object.keys(b)) next[col] = b[col].filter((c) => c.id !== id)
      return next
    })
  }, [])

  const clear = useCallback(() => setBoard(empty()), [])

  const nicheSet = useMemo(() => new Set(Object.values(board).flat().map((c) => c.niche?.toLowerCase())), [board])
  const count = useMemo(() => Object.values(board).flat().length, [board])

  return { board, addCard, moveCard, updateCard, removeCard, clear, nicheSet, count, syncing: cloud && !ready }
}
