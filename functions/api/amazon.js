import { pickUA, AMAZON_NODES, parseBestsellers } from '../_shared.js'

// A bestsellers chart moves hourly at most, so every visitor triggering a fresh
// scrape only burns rate limit and gets us blocked. One shared 30 min copy in
// the edge cache serves everyone.
const TTL = 1800

const cacheKey = (cat) => new Request(`https://cache.marketmax.internal/amazon?cat=${cat}`)

function payload(obj, status, ttl = 0) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': ttl ? `public, max-age=${ttl}` : 'no-store',
    },
  })
}

export async function onRequestGet({ request, waitUntil }) {
  const cat = new URL(request.url).searchParams.get('cat') || 'electronics'
  const node = AMAZON_NODES[cat] || 'electronics'
  const cache = globalThis.caches?.default
  const key = cacheKey(cat)

  if (cache) {
    const hit = await cache.match(key)
    if (hit) {
      const res = new Response(hit.body, hit)
      res.headers.set('x-marketmax-cache', 'HIT')
      return res
    }
  }

  try {
    const r = await fetch(`https://www.amazon.fr/gp/bestsellers/${node}`, {
      headers: {
        'User-Agent': pickUA(),
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!r.ok) return payload({ error: `amazon_http_${r.status}` }, 502)

    const items = parseBestsellers(await r.text())
    if (items.length < 3) return payload({ error: 'amazon_blocked_or_unparseable' }, 502)

    const body = {
      cat,
      fetchedAt: new Date().toISOString(),
      items: items.map((it, i) => ({ ...it, rank: it.bsr ?? i + 1 })),
    }
    const res = payload(body, 200, TTL)
    if (cache) waitUntil?.(cache.put(key, res.clone()))
    res.headers.set('x-marketmax-cache', 'MISS')
    return res
  } catch (e) {
    return payload({ error: 'amazon_unreachable', detail: String(e?.message || e) }, 502)
  }
}
