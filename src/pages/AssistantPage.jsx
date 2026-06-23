import { useEffect, useRef, useState } from 'react'
import { checkOllama, pickModel, askOllama } from '../api/ollama'
import { METRICS } from '../utils/metrics'
import { SparkIcon } from '../components/icons'

const SUGGESTIONS = ['What is BSR?', 'Explain FBA fees', 'What does CPC mean?', 'Summarize this product listing']

function FallbackGlossary() {
  const entries = [
    ['BSR', METRICS.bsr],
    ['FBA fee', METRICS.fba],
    ['CPC', METRICS.cpc],
    ['Search volume', METRICS.volume],
    ['Niche Score', METRICS.niche],
  ]
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offline knowledge base</p>
      {entries.map(([k, v]) => (
        <div key={k} className="rounded-lg border border-line bg-surface p-3">
          <p className="text-sm font-semibold text-slate-800">{k}</p>
          <p className="mt-0.5 text-xs text-slate-500">{v}</p>
        </div>
      ))}
    </div>
  )
}

export default function AssistantPage() {
  const [status, setStatus] = useState({ checking: true, running: false, model: null, models: [] })
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    checkOllama().then((s) => setStatus({ checking: false, running: s.running, models: s.models, model: pickModel(s.models) }))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const send = async (text) => {
    const content = (text ?? input).trim()
    if (!content || sending) return
    setInput('')
    setError(null)
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setSending(true)
    try {
      const reply = await askOllama(next, status.model)
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(e.code === 'ollama_unreachable' ? 'Ollama stopped responding. Is it still running?' : 'The assistant could not answer. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">
          A local, private assistant (Ollama) for factual FBA questions — definitions and metric explanations only.
        </p>
      </div>

      {status.checking && <div className="card h-64 animate-pulse" />}

      {!status.checking && !status.running && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <h2 className="text-sm font-semibold text-slate-800">Ollama is not running</h2>
            </div>
            <p className="text-sm text-slate-500">The assistant works fully offline on your machine. To enable it:</p>
            <ol className="mt-3 space-y-1.5 text-sm text-slate-600">
              <li>1. Install Ollama → <span className="font-mono text-xs">ollama.com</span></li>
              <li>2. Pull a model → <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs">ollama pull mistral</code></li>
              <li>3. Allow this app → <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs">OLLAMA_ORIGINS=* ollama serve</code></li>
              <li>4. Reload this page.</li>
            </ol>
            <p className="mt-3 text-xs text-slate-400">Until then, use the built-in glossary on the right.</p>
          </div>
          <div className="card p-5">
            <FallbackGlossary />
          </div>
        </div>
      )}

      {!status.checking && status.running && (
        <div className="card flex h-[60vh] flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Connected · {status.model}
            </span>
            <span className="text-[11px] text-slate-400">localhost:11434 · private</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint text-brand"><SparkIcon size={22} /></div>
                <p className="text-sm text-slate-500">Ask a factual FBA question.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === 'user' ? 'bg-brand text-white' : 'border border-line bg-surface text-slate-700'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && <div className="flex justify-start"><div className="rounded-2xl border border-line bg-surface px-3.5 py-2 text-sm text-slate-400">Thinking…</div></div>}
            {error && <p className="text-center text-xs text-red-600">{error}</p>}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={sending} className="chip border border-line bg-surface text-slate-600 hover:border-brand/50 hover:text-brand disabled:opacity-50">
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex gap-2"
            >
              <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a metric…" />
              <button type="submit" className="btn-primary" disabled={sending || !input.trim()}>Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
