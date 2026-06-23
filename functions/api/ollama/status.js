import { json } from '../../_shared.js'

// The cloud can't reach a user's localhost Ollama, so report "not running".
export async function onRequestGet() {
  return json({ running: false, models: [], reason: 'ollama is local-only' })
}
