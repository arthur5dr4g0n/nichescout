// ---------------------------------------------------------------------------
// Dev-server proxy plugin. Runs inside Vite (server-side, Node 18+ global fetch)
// so it can call sources that block the browser via CORS, and can set a real
// User-Agent header. Exposes:
//   GET  /api/reddit?sub=AmazonFBA
//   GET  /api/trends?geo=FR
//   GET  /api/amazon?cat=electronics
//   GET  /api/ollama/status
//   POST /api/ollama         (proxies to http://localhost:11434/api/chat)
// Every handler degrades gracefully — the React app falls back to mock data
// whenever a source returns an error.
// ---------------------------------------------------------------------------

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
]
const pickUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

const OLLAMA = 'http://localhost:11434'
const AMAZON_NODES = {
  electronics: 'electronics',
  kitchen: 'kitchen',
  sports: 'sports',
  beauty: 'beauty',
  pets: 'pet-supplies',
}

function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => resolve(data))
    req.on('error', () => resolve(''))
  })
}

// Reddit blocks browser-like UAs as "suspected bots" but allows a unique,
// descriptive UA. Use that instead of the rotating browser pool.
const REDDIT_UA = 'MarketMax/1.0 (Amazon FBA research dashboard)'

function parseRedditRss(xml, sub) {
  const items = []
  const re = /<entry>([\s\S]*?)<\/entry>/g
  let m
  while ((m = re.exec(xml)) && items.length < 25) {
    const block = m[1]
    const title = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1]
    const link = (block.match(/<link[^>]*href="([^"]+)"/) || [])[1]
    const updated = (block.match(/<updated>([\s\S]*?)<\/updated>/) || [])[1]
    const id = (block.match(/<id>([\s\S]*?)<\/id>/) || [])[1]
    if (!title) continue
    items.push({
      id: id || link || title,
      title: title.trim(),
      url: link || `https://www.reddit.com/r/${sub}`,
      ups: 0,
      comments: 0,
      created: updated ? Date.parse(updated) : Date.now(),
      sub,
      flair: null,
    })
  }
  return items
}

async function handleReddit(res, url) {
  const sub = (url.searchParams.get('sub') || 'AmazonFBA').replace(/[^a-zA-Z0-9_]/g, '')
  // 1) Try the JSON API (richest: scores + comment counts).
  try {
    const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25&raw_json=1`, {
      headers: { 'User-Agent': REDDIT_UA, Accept: 'application/json' },
    })
    if (r.ok) {
      const j = await r.json()
      const items = (j?.data?.children || [])
        .map((c) => c.data)
        .filter((d) => d && !d.stickied)
        .map((d) => ({
          id: d.id,
          title: d.title,
          url: 'https://www.reddit.com' + d.permalink,
          ups: d.ups || 0,
          comments: d.num_comments || 0,
          created: (d.created_utc || 0) * 1000,
          sub: d.subreddit,
          flair: d.link_flair_text || null,
        }))
      if (items.length) return sendJson(res, 200, { items })
    }
  } catch {
    /* fall through to RSS */
  }
  // 2) Fall back to the Atom feed (often less restricted; no scores).
  try {
    const r = await fetch(`https://www.reddit.com/r/${sub}/hot.rss?limit=25`, {
      headers: { 'User-Agent': REDDIT_UA, Accept: 'application/rss+xml, application/atom+xml' },
    })
    if (!r.ok) return sendJson(res, 502, { error: `reddit_http_${r.status}` })
    const items = parseRedditRss(await r.text(), sub)
    if (!items.length) return sendJson(res, 502, { error: 'reddit_empty' })
    sendJson(res, 200, { items })
  } catch (e) {
    sendJson(res, 502, { error: 'reddit_unreachable', detail: String(e?.message || e) })
  }
}

async function handleTrends(res, url) {
  const geo = (url.searchParams.get('geo') || 'FR').replace(/[^A-Za-z]/g, '').slice(0, 4) || 'FR'
  // Google replaced the old "daily/rss" feed with "/trending/rss". Try the new
  // one first, fall back to the legacy URL for older regions.
  const endpoints = [
    `https://trends.google.com/trending/rss?geo=${geo}`,
    `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
  ]
  try {
    let xml = ''
    let lastStatus = 0
    for (const ep of endpoints) {
      const r = await fetch(ep, { headers: { 'User-Agent': pickUA() } })
      lastStatus = r.status
      if (r.ok) {
        xml = await r.text()
        break
      }
    }
    if (!xml) return sendJson(res, 502, { error: `trends_http_${lastStatus}` })
    const items = []
    const re = /<item>([\s\S]*?)<\/item>/g
    let m
    while ((m = re.exec(xml)) && items.length < 25) {
      const block = m[1]
      const title = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1]
      const traffic = (block.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/) || [])[1]
      if (title) items.push({ title: title.trim(), traffic: (traffic || '').trim() })
    }
    if (!items.length) return sendJson(res, 502, { error: 'trends_empty' })
    sendJson(res, 200, { items, geo })
  } catch (e) {
    sendJson(res, 502, { error: 'trends_unreachable', detail: String(e?.message || e) })
  }
}

// Kept in sync with functions/_shared.js — dev proxy and Pages Function must
// return the exact same shape, or the app behaves differently once deployed.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
}

const clean = (s) => decodeEntities(s).replace(/\s+/g, ' ').trim()

// "1 234,56 €" / "9,99 €" -> 1234.56 / 9.99 (nbsp + narrow nbsp groupers).
function parsePrice(raw) {
  if (!raw) return null
  const normalized = decodeEntities(raw)
    .replace(/[^\d,.\s  ]/g, '')
    .replace(/[\s  .]/g, '')
    .replace(',', '.')
  const n = Number.parseFloat(normalized)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

function parseCount(raw) {
  if (!raw) return null
  const n = Number.parseInt(decodeEntities(raw).replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

// Amazon bestseller grids render one card per `data-asin` block. Splitting on
// that boundary first is what keeps price/rating/reviews attached to the right
// product — a whole-page regex cannot, and silently mismatches them.
function parseBestsellers(html, limit = 100) {
  const items = []
  const seen = new Set()
  const cards = html.split(/data-asin="/).slice(1)

  for (const card of cards) {
    if (items.length >= limit) break
    const asin = (card.match(/^([A-Z0-9]{10})"/) || [])[1]
    if (!asin || seen.has(asin)) continue

    // Stop before the next card so a missing field never borrows its neighbour's.
    const block = card.slice(0, 6000)

    const title =
      (block.match(/p13n-sc-css-line-clamp-\d+_[^"]*">([^<]{6,400})</) || [])[1] ||
      (block.match(/class="[^"]*p13n-product-image[^"]*"[^>]*alt="([^"]{6,400})"/) || [])[1] ||
      (block.match(/alt="([^"]{6,400})"/) || [])[1]
    if (!title) continue

    // Class-name hashes (_3mJ9Z, …) change on every Amazon build — never match them.
    const price = parsePrice((block.match(/p13n-sc-price[^"]*">([^<]+)</) || [])[1])

    // One aria-label carries both rating and review count, in that order.
    const meta = block.match(/aria-label="([\d,.]+)\s+sur\s+5[^"]*?,\s*([\d\s  .]+)\s*(?:évaluation|avis|note)/i) || []
    const rating = meta[1] ? Number.parseFloat(meta[1].replace(',', '.')) : null
    let reviews = parseCount(meta[2])
    if (reviews == null) reviews = parseCount((block.match(/class="a-size-small">([\d\s  .]+)</) || [])[1])

    const bsr = parseCount((block.match(/zg-bdg-text">#([\d\s  .]+)</) || [])[1])
    const image = (block.match(/src="(https:\/\/[^"]+\.(?:jpg|png))"/) || [])[1] || ''

    seen.add(asin)
    items.push({
      asin,
      title: clean(title),
      price,
      rating: Number.isFinite(rating) ? rating : null,
      reviews,
      bsr,
      image,
    })
  }
  return items
}

async function handleAmazon(res, url) {
  const cat = url.searchParams.get('cat') || 'electronics'
  const node = AMAZON_NODES[cat] || 'electronics'
  try {
    const r = await fetch(`https://www.amazon.fr/gp/bestsellers/${node}`, {
      headers: {
        'User-Agent': pickUA(),
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!r.ok) return sendJson(res, 502, { error: `amazon_http_${r.status}` })
    const html = await r.text()
    const items = parseBestsellers(html)
    if (items.length < 3) return sendJson(res, 502, { error: 'amazon_blocked_or_unparseable' })
    sendJson(res, 200, {
      cat,
      fetchedAt: new Date().toISOString(),
      items: items.map((it, i) => ({ ...it, rank: it.bsr ?? i + 1 })),
    })
  } catch (e) {
    sendJson(res, 502, { error: 'amazon_unreachable', detail: String(e?.message || e) })
  }
}

async function handleOllamaStatus(res) {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(2500) })
    if (!r.ok) return sendJson(res, 200, { running: false })
    const j = await r.json()
    sendJson(res, 200, { running: true, models: (j?.models || []).map((m) => m.name) })
  } catch {
    sendJson(res, 200, { running: false })
  }
}

async function handleOllamaChat(req, res) {
  try {
    const body = await readBody(req)
    const r = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    const text = await r.text()
    res.statusCode = r.ok ? 200 : r.status
    res.setHeader('Content-Type', 'application/json')
    res.end(text)
  } catch (e) {
    sendJson(res, 503, { error: 'ollama_unreachable', detail: String(e?.message || e) })
  }
}

export function researchProxy() {
  return {
    name: 'marketmax-research-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()
        const url = new URL(req.url, 'http://localhost')
        try {
          if (url.pathname === '/api/reddit') return await handleReddit(res, url)
          if (url.pathname === '/api/trends') return await handleTrends(res, url)
          if (url.pathname === '/api/amazon') return await handleAmazon(res, url)
          if (url.pathname === '/api/ollama/status') return await handleOllamaStatus(res)
          if (url.pathname === '/api/ollama' && req.method === 'POST') return await handleOllamaChat(req, res)
          return sendJson(res, 404, { error: 'unknown_endpoint' })
        } catch (e) {
          return sendJson(res, 500, { error: 'proxy_error', detail: String(e?.message || e) })
        }
      })
    },
  }
}
