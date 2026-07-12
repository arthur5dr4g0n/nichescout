// Amazon data layer. Real data goes through the authed server proxy
// /api/rapid (RapidAPI key stays server-side); falls back to mock when the
// proxy isn't configured or in explicit mock mode.
import { USE_MOCK, COUNTRY } from '../config'
import { tryLiveAuthed } from './live'
import { estimateMonthlySales, estimateFbaFees } from '../utils/estimates'
import * as mock from './mockData'

// Errors that mean "real mode unavailable" -> silently use mock, like before.
const FALLBACK_ERRORS = ['not_configured', 'offline', 'unauthorized']

// Parse messy price strings like "$24.99" -> 24.99
function parsePrice(v) {
  if (v == null) return 0
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// Map one RapidAPI search item into our internal product shape.
function normalizeProduct(item, i) {
  const price = parsePrice(item.product_price ?? item.product_original_price)
  const reviews = Number(item.product_num_ratings) || 0
  const rating = parseFloat(item.product_star_rating) || 0
  // BSR is not in the search payload; estimate sales from review velocity as a
  // rough proxy, and flag it. (Expand a product to fetch real BSR if desired.)
  const bsr = item.product_bsr || null
  const category = item.category || 'default'
  const sales = bsr ? estimateMonthlySales(bsr, category) : Math.round(reviews * 1.2)
  const revenue = Math.round(sales * price)
  const fba = estimateFbaFees(price)
  return {
    asin: item.asin || `ITEM${i}`,
    title: item.product_title || 'Unknown product',
    brand: item.brand || '—',
    category,
    price,
    bsr,
    bsrEstimated: !bsr,
    sales,
    revenue,
    reviews,
    rating,
    sellers: Number(item.product_num_offers) || 1,
    fbaFee: fba.total,
    fbaBreakdown: fba,
    image: item.product_photo || item.product_main_image_url || '',
    url: item.product_url || '#',
    bsrHistory: null,
    revenueHistory: null,
  }
}

async function rapid(params) {
  const qs = new URLSearchParams({ ...params, country: COUNTRY }).toString()
  return tryLiveAuthed(`/api/rapid?${qs}`, { timeout: 25000 })
}

export async function searchProducts(keyword) {
  if (USE_MOCK) return mock.searchProducts(keyword)
  let data
  try {
    data = await rapid({ op: 'search', query: keyword })
  } catch (e) {
    if (FALLBACK_ERRORS.includes(e.message)) return mock.searchProducts(keyword)
    throw e
  }
  const products = data?.data?.products || []
  if (!products.length) throw new Error('No products returned by Amazon for this keyword.')
  return products.map(normalizeProduct)
}

export async function getCompetitors(asin) {
  if (USE_MOCK) return mock.getCompetitors(asin)
  let details
  try {
    // 1) get the seed product to learn its title/category
    details = await rapid({ op: 'details', asin })
  } catch (e) {
    if (FALLBACK_ERRORS.includes(e.message)) return mock.getCompetitors(asin)
    throw e
  }
  const seed = details?.data
  const query = seed?.product_title?.split(' ').slice(0, 4).join(' ') || asin
  // 2) search for similar products and take the top 10
  const data = await rapid({ op: 'search', query })
  const products = (data?.data?.products || []).slice(0, 10)
  if (!products.length) throw new Error('No competitors found for this ASIN.')
  return products.map(normalizeProduct).map((p, i) => ({ ...p, rank: i + 1 }))
}
