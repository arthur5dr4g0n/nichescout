// Amazon Best Sellers (amazon.fr public pages) via /api/amazon, which parses one
// card per product and returns real price, rating, review count, official BSR and
// image. Only sales/revenue/FBA fees stay derived (Amazon never publishes volumes),
// which `estimated` flags for the UI. Amazon can still block the scrape — the
// client then falls back to mock and the UI labels the source.
import { tryLive } from './live'
import { mockBestsellers } from './mockSignals'
import { estimateMonthlySales, estimateMonthlyRevenue, estimateFbaFees } from '../utils/estimates'

export const BS_CATEGORIES = [
  { id: 'electronics', label: 'High-Tech' },
  { id: 'kitchen', label: 'Cuisine' },
  { id: 'sports', label: 'Sport' },
  { id: 'beauty', label: 'Beauté' },
  { id: 'pets', label: 'Animalerie' },
]

// Bestseller node -> the category name estimates.js weights sales by.
const ESTIMATE_CATEGORY = {
  electronics: 'Electronics',
  kitchen: 'Kitchen & Dining',
  sports: 'Sports & Outdoors',
  beauty: 'Beauty & Personal Care',
  pets: 'Pet Supplies',
}

export async function fetchBestsellers(cat = 'electronics') {
  try {
    const j = await tryLive(`/api/amazon?cat=${encodeURIComponent(cat)}`)
    const category = ESTIMATE_CATEGORY[cat] || 'default'
    const items = (j.items || []).map((it, i) => {
      const bsr = it.bsr ?? it.rank ?? i + 1
      const price = it.price ?? null
      return {
        rank: it.rank ?? bsr,
        asin: it.asin,
        title: it.title,
        category,
        bsr,
        // Read straight off the page:
        price,
        reviews: it.reviews ?? null,
        rating: it.rating ?? null,
        image: it.image || '',
        // Derived from BSR + price:
        sales: estimateMonthlySales(bsr, category),
        revenue: price == null ? null : estimateMonthlyRevenue(bsr, price, category),
        fbaFee: price == null ? null : estimateFbaFees(price).total,
        // Not exposed on bestseller pages — would need a product-details call.
        sellers: null,
        estimated: true,
        url: `https://www.amazon.fr/dp/${it.asin}`,
      }
    })
    if (items.length < 3) throw new Error('too_few')
    return { data: items, source: 'live', fetchedAt: j.fetchedAt || null }
  } catch {
    return { data: mockBestsellers(cat), source: 'mock' }
  }
}
