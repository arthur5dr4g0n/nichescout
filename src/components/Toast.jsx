import { createContext, useCallback, useContext, useState } from 'react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

let seq = 0
const TONES = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-brand/30 bg-brand-tint text-brand-dark',
}
const ICONS = { success: '✓', error: '⚠', info: 'ℹ' }

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const remove = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), [])
  const push = useCallback(
    (type, message) => {
      const id = ++seq
      setItems((l) => [...l, { id, type, message }])
      setTimeout(() => remove(id), 3800)
    },
    [remove],
  )

  const api = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,340px)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            className={`pointer-events-auto flex animate-fadein items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-pop ${TONES[t.type]}`}
          >
            <span className="mt-0.5 font-bold">{ICONS[t.type]}</span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
