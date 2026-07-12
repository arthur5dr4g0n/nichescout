import { json } from '../_shared.js'
import { getAuthUser } from '../_stripe.js'

// Server-side proxy to DataForSEO (server-to-server only: CORS blocks the
// browser anyway). Credentials stay on the server; callers must be logged in.
export async function onRequestPost({ env, request }) {
  if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) return json({ error: 'not_configured' }, 503)

  const user = await getAuthUser(env, request)
  if (!user?.id) return json({ error: 'unauthorized' }, 401)

  const { seed } = await request.json().catch(() => ({}))
  const kw = String(seed || '').trim().slice(0, 80)
  if (!kw) return json({ error: 'missing_seed' }, 400)

  try {
    const auth = btoa(`${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`)
    const r = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ keywords: [kw], location_code: 2840, language_code: 'en', limit: 18 }]),
    })
    if (!r.ok) return json({ error: `dataforseo_http_${r.status}` }, 502)
    const data = await r.json()
    return json({ items: data?.tasks?.[0]?.result || [] })
  } catch (e) {
    return json({ error: 'dataforseo_unreachable', detail: String(e?.message || e) }, 502)
  }
}
