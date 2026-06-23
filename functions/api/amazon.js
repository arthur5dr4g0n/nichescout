import { pickUA, AMAZON_NODES, parseBestsellers, json } from '../_shared.js'

export async function onRequestGet({ request }) {
  const cat = new URL(request.url).searchParams.get('cat') || 'electronics'
  const node = AMAZON_NODES[cat] || 'electronics'
  try {
    const r = await fetch(`https://www.amazon.fr/gp/bestsellers/${node}`, {
      headers: {
        'User-Agent': pickUA(),
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!r.ok) return json({ error: `amazon_http_${r.status}` }, 502)
    const items = parseBestsellers(await r.text())
    if (items.length < 3) return json({ error: 'amazon_blocked_or_unparseable' }, 502)
    return json({ items: items.map((it, i) => ({ ...it, rank: i + 1 })), cat })
  } catch (e) {
    return json({ error: 'amazon_unreachable', detail: String(e?.message || e) }, 502)
  }
}
