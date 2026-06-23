// Amazon Best Sellers (amazon.fr public pages) via the dev proxy with rotating
// user-agents. Amazon heavily blocks scraping, so this commonly falls back to
// mock — the UI labels the source either way. Live rows only reliably yield
// ASIN + title + rank, so sales are estimated from rank and other fields are n/a.
import { tryLive } from './live'
import { mockBestsellers } from './mockSignals'
import { estimateMonthlySales } from '../utils/estimates'

export const BS_CATEGORIES = [
  { id: 'electronics', label: 'High-Tech' },
  { id: 'kitchen', label: 'Cuisine' },
  { id: 'sports', label: 'Sport' },
  { id: 'beauty', label: 'Beauté' },
  { id: 'pets', label: 'Animalerie' },
]

export async function fetchBestsellers(cat = 'electronics') {
  try {
    const j = await tryLive(`/api/amazon?cat=${encodeURIComponent(cat)}`)
    const items = (j.items || []).map((it, i) => {
      const bsr = it.rank || i + 1
      return {
        rank: bsr,
        asin: it.asin,
        title: it.title,
        bsr,
        price: null,
        sales: estimateMonthlySales(bsr),
        revenue: null,
        reviews: null,
        rating: null,
        sellers: null,
        fbaFee: null,
        estimated: true,
        image: '',
        url: `https://www.amazon.fr/dp/${it.asin}`,
      }
    })
    if (items.length < 3) throw new Error('too_few')
    return { data: items, source: 'live' }
  } catch {
    return { data: mockBestsellers(cat), source: 'mock' }
  }
}
