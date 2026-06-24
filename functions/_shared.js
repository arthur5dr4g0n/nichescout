// Shared helpers for Cloudflare Pages Functions (Workers runtime).
// Mirrors vite.proxy.js so live data also works on the deployed site.

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
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

export function parseBestsellers(html) {
  const items = []
  const seen = new Set()
  const re = /\/dp\/([A-Z0-9]{10})[^>]*?>([\s\S]{0,400}?)(?:<\/a>)/g
  let m
  while ((m = re.exec(html)) && items.length < 30) {
    const asin = m[1]
    if (seen.has(asin)) continue
    const chunk = m[2]
    const title = (chunk.match(/alt="([^"]{6,200})"/) || chunk.match(/>([^<]{12,200})</) || [])[1]
    if (!title) continue
    seen.add(asin)
    items.push({ asin, title: title.replace(/\s+/g, ' ').trim() })
  }
  return items
}
