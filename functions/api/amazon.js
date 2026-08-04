import { pickUA, AMAZON_NODES, parseBestsellers } from '../_shared.js'

// Serving order: edge cache -> Supabase snapshot -> live scrape -> 502 (mock).
//
// Snapshots come first on purpose. .github/workflows/scrape.yml fills them every
// 3 hours, so the normal path never touches Amazon while a user waits: fast, and
// nothing to block. Scraping live is only the safety net for a category the job
// has not captured yet. `source` and `fetchedAt` let the UI state which it got.
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

// Latest complete batch for a category, via the RPC in bestsellers_snapshots.sql.
async function fromSnapshot(env, cat) {
  if (!env?.SUPABASE_URL) return null
  const anonKey = env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_KEY
  if (!anonKey) return null

  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/latest_bestsellers`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_cat: cat }),
  })
  if (!r.ok) return null

  const rows = await r.json()
  if (!Array.isArray(rows) || rows.length < 3) return null

  return {
    cat,
    source: 'snapshot',
    fetchedAt: rows[0].captured_at,
    items: rows.map((row) => ({
      asin: row.asin,
      title: row.title,
      price: row.price == null ? null : Number(row.price),
      rating: row.rating == null ? null : Number(row.rating),
      reviews: row.reviews,
      image: row.image || '',
      bsr: row.rank,
      rank: row.rank,
    })),
  }
}

async function fromAmazon(cat, node) {
  const r = await fetch(`https://www.amazon.fr/gp/bestsellers/${node}`, {
    headers: {
      'User-Agent': pickUA(),
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!r.ok) throw new Error(`amazon_http_${r.status}`)

  const items = parseBestsellers(await r.text())
  if (items.length < 3) throw new Error('amazon_blocked_or_unparseable')

  return {
    cat,
    source: 'live',
    fetchedAt: new Date().toISOString(),
    items: items.map((it, i) => ({ ...it, rank: it.bsr ?? i + 1 })),
  }
}

export async function onRequestGet({ request, env, waitUntil }) {
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

  let body = null
  try {
    body = await fromSnapshot(env, cat)
  } catch {
    // Supabase down is not fatal — fall through to the live scrape.
  }

  if (!body) {
    try {
      body = await fromAmazon(cat, node)
    } catch (e) {
      return payload({ error: String(e?.message || e) }, 502)
    }
  }

  const res = payload(body, 200, TTL)
  if (cache) waitUntil?.(cache.put(key, res.clone()))
  res.headers.set('x-marketmax-cache', 'MISS')
  return res
}
