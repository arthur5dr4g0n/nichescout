// Reddit FBA buzz. Public hot.json via the dev proxy (Reddit blocks direct
// browser calls with CORS). Falls back to mock if blocked / rate-limited.
import { tryLive } from './live'
import { mockReddit } from './mockSignals'

const SUBS = ['AmazonFBA', 'FulfillmentByAmazon']

export async function fetchReddit(subs = SUBS) {
  try {
    const results = await Promise.all(subs.map((s) => tryLive(`/api/reddit?sub=${encodeURIComponent(s)}`)))
    const items = results.flatMap((r) => r.items || [])
    if (!items.length) throw new Error('empty')
    items.sort((a, b) => b.created - a.created)
    return { data: items.slice(0, 30), source: 'live' }
  } catch {
    return { data: mockReddit(subs), source: 'mock' }
  }
}
