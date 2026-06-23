// Local AI assistant via Ollama (http://localhost:11434), proxied through the
// dev server to avoid browser CORS. Restricted to factual FBA questions.
import { tryLive } from './live'

export const OLLAMA_SYSTEM_PROMPT = `You are a factual Amazon FBA assistant.
Never estimate sales or predict profitability.
Only explain metrics and definitions.
If unsure, say explicitly: I don't know.`

const PREFERRED = ['mistral', 'llama3', 'llama3.1']

// Returns { running, models: [...] }
export async function checkOllama() {
  try {
    const j = await tryLive('/api/ollama/status', { timeout: 3000 })
    return { running: Boolean(j.running), models: j.models || [] }
  } catch {
    return { running: false, models: [] }
  }
}

export function pickModel(models = []) {
  for (const p of PREFERRED) {
    const found = models.find((m) => m.toLowerCase().startsWith(p))
    if (found) return found
  }
  return models[0] || 'mistral'
}

// messages: [{ role:'user'|'assistant', content }]
export async function askOllama(messages, model) {
  const res = await fetch('/api/ollama', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'mistral',
      stream: false,
      options: { temperature: 0.2 },
      messages: [{ role: 'system', content: OLLAMA_SYSTEM_PROMPT }, ...messages],
    }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    const err = new Error(j.error || `http_${res.status}`)
    err.code = j.error
    throw err
  }
  const j = await res.json()
  return j?.message?.content?.trim() || "I don't know."
}
