import { useCallback, useRef, useState } from 'react'

// Runs an async function and tracks loading / error / data.
// Guards against out-of-order responses with a request id.
export function useAsync(asyncFn) {
  const [state, setState] = useState({ loading: false, error: null, data: null, ran: false })
  const reqId = useRef(0)

  const run = useCallback(
    async (...args) => {
      const id = ++reqId.current
      setState((s) => ({ ...s, loading: true, error: null, ran: true }))
      try {
        const data = await asyncFn(...args)
        if (id === reqId.current) setState({ loading: false, error: null, data, ran: true })
        return data
      } catch (err) {
        if (id === reqId.current) {
          setState({ loading: false, error: normalizeError(err), data: null, ran: true })
        }
      }
    },
    [asyncFn],
  )

  const reset = useCallback(() => {
    reqId.current++
    setState({ loading: false, error: null, data: null, ran: false })
  }, [])

  return { ...state, run, reset }
}

function normalizeError(err) {
  if (err?.response) {
    const code = err.response.status
    if (code === 401 || code === 403) return 'Authentication failed — check your API key in .env.'
    if (code === 429) return 'Rate limit reached — the free API tier is exhausted. Try again later or use mock mode.'
    return `API error ${code}. ${err.response.data?.message || 'Please try again.'}`
  }
  if (err?.code === 'ERR_NETWORK') return 'Network/CORS error — the API blocked the browser request. Mock mode avoids this.'
  return err?.message || 'Something went wrong.'
}
