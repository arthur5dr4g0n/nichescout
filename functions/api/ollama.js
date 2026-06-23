import { json } from '../_shared.js'

// Ollama runs on the user's machine (localhost:11434) and is unreachable from
// the deployed cloud site. The client handles this 503 by showing the built-in
// offline glossary. Run the app locally (npm start) to use the live assistant.
export async function onRequestPost() {
  return json(
    { error: 'ollama_unreachable', detail: 'Ollama is local-only. Run NicheScout locally to chat with the assistant.' },
    503,
  )
}
