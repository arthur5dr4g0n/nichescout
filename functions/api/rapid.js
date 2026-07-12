import { json } from '../_shared.js'
import { getAuthUser } from '../_stripe.js'

// Server-side proxy to RapidAPI "Real-Time Amazon Data". The key never
// reaches the browser; callers must be logged in (quota protection).
export async function onRequestGet({ env, request }) {
  if (!env.RAPIDAPI_KEY) return json({ error: 'not_configured' }, 503)

  const user = await getAuthUser(env, request)
  if (!user?.id) return json({ error: 'unauthorized' }, 401)

  const host = env.RAPIDAPI_HOST || 'real-time-amazon-data.p.rapidapi.com'
  const u = new URL(request.url)
  const country = (u.searchParams.get('country') || 'FR').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'FR'

  let target
  const op = u.searchParams.get('op')
  if (op === 'search') {
    const query = (u.searchParams.get('query') || '').trim().slice(0, 120)
    if (!query) return json({ error: 'missing_query' }, 400)
    target = `https://${host}/search?query=${encodeURIComponent(query)}&country=${country}&page=1`
  } else if (op === 'details') {
    const asin = (u.searchParams.get('asin') || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 12)
    if (!asin) return json({ error: 'missing_asin' }, 400)
    target = `https://${host}/product-details?asin=${asin}&country=${country}`
  } else {
    return json({ error: 'bad_op' }, 400)
  }

  try {
    const r = await fetch(target, {
      headers: { 'X-RapidAPI-Key': env.RAPIDAPI_KEY, 'X-RapidAPI-Host': host },
    })
    if (!r.ok) return json({ error: `rapid_http_${r.status}` }, 502)
    return json(await r.json())
  } catch (e) {
    return json({ error: 'rapid_unreachable', detail: String(e?.message || e) }, 502)
  }
}
