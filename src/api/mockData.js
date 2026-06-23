// ---------------------------------------------------------------------------
// Realistic MOCK data. Default mode so the app works with zero API keys.
// Results are SEEDED from the query string, so the same search gives stable
// numbers (feels like a real product instead of reshuffling every render).
// ---------------------------------------------------------------------------
import { estimateMonthlySales, estimateMonthlyRevenue, estimateFbaFees } from '../utils/estimates'
import { CATEGORIES } from '../utils/estimates'

// --- seeded PRNG (mulberry32) ------------------------------------------------
function hashString(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return (h ^ (h >>> 16)) >>> 0
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeRng(seedStr) {
  const rand = mulberry32(hashString(seedStr))
  return {
    float: (min, max) => min + (max - min) * rand(),
    int: (min, max) => Math.floor(min + (max - min + 1) * rand()),
    pick: (arr) => arr[Math.floor(rand() * arr.length)],
    bool: (p = 0.5) => rand() < p,
  }
}

// --- vocabulary for plausible titles ----------------------------------------
const ADJ = ['Premium', 'Eco', 'Pro', 'Ultra', 'Compact', 'Heavy-Duty', 'Smart', 'Portable', 'Adjustable', 'Stainless', 'Organic', 'Reusable']
const NOUN = ['Set', 'Kit', 'Bundle', 'Pack of 2', 'with Stand', 'Organizer', 'Holder', 'XL Edition', 'Travel Size', 'Deluxe']
const FEATURE = ['BPA-Free', 'for Home & Office', 'Gift Ready', 'Easy Clean', 'Non-Slip', '2026 Model', 'FDA Approved', 'Leak-Proof', 'Fast Charging', 'Ergonomic']
const BRANDS = ['Vantor', 'Helix', 'Nuvo', 'Pawket', 'Lumio', 'Kestrel', 'Orbita', 'Greenly', 'Maxa', 'Trove', 'Volta', 'Cedar&Co']

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function makeAsin(rng) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  let s = 'B0'
  for (let i = 0; i < 8; i++) s += chars[rng.int(0, chars.length - 1)]
  return s
}

// 12 months of slightly noisy history around a current value.
function makeHistory(rng, current, { invert = false } = {}) {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  let v = current * rng.float(0.6, 1.4)
  return months.map((m) => {
    const drift = rng.float(invert ? -0.12 : -0.18, invert ? 0.18 : 0.12)
    v = Math.max(1, v * (1 + drift))
    // ease the last point toward the real current value
    return { month: m, value: Math.round(v) }
  }).map((pt, i, arr) => (i === arr.length - 1 ? { month: pt.month, value: Math.round(current) } : pt))
}

function buildProduct(rng, keyword, i) {
  const category = rng.pick(CATEGORIES)
  const price = +rng.float(9, 95).toFixed(2)
  const bsr = rng.int(40, 90000)
  const weightLb = +rng.float(0.2, 4).toFixed(2)
  const sales = estimateMonthlySales(bsr, category)
  const revenue = estimateMonthlyRevenue(bsr, price, category)
  const reviews = rng.int(3, 4200)
  const rating = +rng.float(3.3, 5).toFixed(1)
  const sellers = rng.int(1, 28)
  const fba = estimateFbaFees(price, weightLb)
  const brand = rng.pick(BRANDS)
  const title = `${brand} ${rng.pick(ADJ)} ${titleCase(keyword)} ${rng.pick(NOUN)} — ${rng.pick(FEATURE)}`

  return {
    asin: makeAsin(rng),
    title,
    brand,
    category,
    price,
    bsr,
    weightLb,
    sales,
    revenue,
    reviews,
    rating,
    sellers,
    fbaFee: fba.total,
    fbaBreakdown: fba,
    image: `https://picsum.photos/seed/${encodeURIComponent(keyword + i)}/300/300`,
    url: '#',
    bsrHistory: makeHistory(rng, bsr, { invert: true }),
    revenueHistory: makeHistory(rng, revenue),
  }
}

// Simulate network latency so loading skeletons are visible.
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export async function searchProducts(keyword, count = 12) {
  await delay(700)
  const rng = makeRng('search::' + keyword.toLowerCase().trim())
  return Array.from({ length: count }, (_, i) => buildProduct(rng, keyword, i))
}

export async function getCompetitors(asin, count = 10) {
  await delay(800)
  const seedKw = 'rival ' + (asin || 'product')
  const rng = makeRng('comp::' + (asin || '').toLowerCase().trim())
  // Build a coherent set themed around one fake niche.
  const niche = rng.pick(['water bottle', 'yoga mat', 'desk lamp', 'dog leash', 'coffee grinder', 'phone stand', 'plant pot', 'knife set'])
  return Array.from({ length: count }, (_, i) => buildProduct(rng, niche, i + 1)).map((p, i) => ({
    ...p,
    rank: i + 1,
  }))
}

const KW_MODS = ['best', 'cheap', 'for women', 'for men', 'for kids', 'reusable', 'stainless steel', 'set', 'with lid', 'bulk', 'wholesale', 'near me', 'amazon', 'review', 'vs', '2026', 'gift', 'small', 'large', 'eco friendly']

export async function keywordResearch(seed) {
  await delay(650)
  const base = seed.toLowerCase().trim()
  const rng = makeRng('kw::' + base)
  const variants = [base, ...KW_MODS.map((m) => (rng.bool() ? `${m} ${base}` : `${base} ${m}`))]
  const seen = new Set()
  return variants
    .filter((k) => (seen.has(k) ? false : (seen.add(k), true)))
    .slice(0, 18)
    .map((keyword) => {
      const r = makeRng('kwrow::' + keyword)
      const volume = r.int(120, 74000)
      const compNum = +r.float(0.05, 0.98).toFixed(2)
      const competition = compNum < 0.34 ? 'Low' : compNum < 0.67 ? 'Medium' : 'High'
      const cpc = +r.float(0.15, 3.8).toFixed(2)
      const dir = r.pick(['up', 'up', 'flat', 'down'])
      const spark = makeHistory(r, volume).slice(-6)
      return { keyword, volume, competition, competitionScore: compNum, cpc, trend: dir, spark }
    })
    .sort((a, b) => b.volume - a.volume)
}
