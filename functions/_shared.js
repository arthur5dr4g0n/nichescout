// Shared helpers for Cloudflare Pages Functions (Workers runtime).
// Mirrors vite.proxy.js so live data also works on the deployed site.

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
]
export const pickUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

// Reddit blocks browser-like UAs as bots but allows a unique descriptive one.
export const REDDIT_UA = 'MarketMax/1.0 (Amazon FBA research dashboard)'

export const AMAZON_NODES = {
  electronics: 'electronics',
  kitchen: 'kitchen',
  sports: 'sports',
  beauty: 'beauty',
  pets: 'pet-supplies',
}

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export function parseRedditRss(xml, sub) {
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
export function parseBestsellers(html, limit = 100) {
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
