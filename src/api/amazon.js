// Amazon data layer. Switches between mock and the RapidAPI
// "Real-Time Amazon Data" endpoints based on config.
import axios from 'axios'
import { USE_MOCK, RAPID_READY, RAPIDAPI_KEY, RAPIDAPI_HOST, COUNTRY } from '../config'
import { estimateMonthlySales, estimateMonthlyRevenue, estimateFbaFees } from '../utils/estimates'
import * as mock from './mockData'

const useRealAmazon = !USE_MOCK && RAPID_READY

const rapid = axios.create({
  baseURL: `https://${RAPIDAPI_HOST}`,
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
  },
  timeout: 20000,
})

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

export async function searchProducts(keyword) {
  if (!useRealAmazon) return mock.searchProducts(keyword)
  const { data } = await rapid.get('/search', {
    params: { query: keyword, country: COUNTRY, page: '1' },
  })
  const products = data?.data?.products || []
  if (!products.length) throw new Error('No products returned by Amazon for this keyword.')
  return products.map(normalizeProduct)
}

export async function getCompetitors(asin) {
  if (!useRealAmazon) return mock.getCompetitors(asin)
  // 1) get the seed product to learn its title/category
  const { data: details } = await rapid.get('/product-details', {
    params: { asin, country: COUNTRY },
  })
  const seed = details?.data
  const query = seed?.product_title?.split(' ').slice(0, 4).join(' ') || asin
  // 2) search for similar products and take the top 10
  const { data } = await rapid.get('/search', { params: { query, country: COUNTRY, page: '1' } })
  const products = (data?.data?.products || []).slice(0, 10)
  if (!products.length) throw new Error('No competitors found for this ASIN.')
  return products.map(normalizeProduct).map((p, i) => ({ ...p, rank: i + 1 }))
}
