// Realistic MOCK data for the free signal sources (Trends, Reddit, Best Sellers).
// Seeded so values stay stable between renders.
import { estimateMonthlySales, estimateMonthlyRevenue, estimateFbaFees } from '../utils/estimates'

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
function rng(seed) {
  const r = mulberry32(hashString(seed))
  return { f: (a, b) => a + (b - a) * r(), i: (a, b) => Math.floor(a + (b - a + 1) * r()), pick: (arr) => arr[Math.floor(r() * arr.length)] }
}

export const TREND_CATEGORIES = ['Electronics', 'Kitchen', 'Sports', 'Beauty', 'Pets']

const CAT_KEYWORDS = {
  Electronics: ['portable projector', 'mini drone', 'smart plug', 'usb-c hub', 'bluetooth tracker', 'noise-cancel earbuds'],
  Kitchen: ['air fryer liners', 'reusable food wrap', 'milk frother', 'spice rack', 'garlic press', 'silicone baking mat'],
  Sports: ['resistance bands', 'yoga wheel', 'running belt', 'massage gun', 'weighted jump rope', 'grip strengthener'],
  Beauty: ['gua sha', 'lip oil', 'heatless curls', 'jade roller', 'scalp massager', 'silk bonnet'],
  Pets: ['slow feeder bowl', 'dog nail grinder', 'cat water fountain', 'lick mat', 'pet hair remover', 'calming dog bed'],
}

// 30-day interest series (0-100) with a seeded slope.
function genSeries(seed) {
  const r = mulberry32(hashString(seed))
  const slope = (r() - 0.45) * 2.2 // -1..+1.2 ish
  let v = 30 + r() * 40
  const out = []
  for (let d = 0; d < 30; d++) {
    v = Math.max(2, Math.min(100, v + slope + (r() - 0.5) * 9))
    out.push({ day: d + 1, value: Math.round(v) })
  }
  return out
}

function momentum(series) {
  const last7 = series.slice(-7).reduce((a, b) => a + b.value, 0) / 7
  const prev7 = series.slice(-14, -7).reduce((a, b) => a + b.value, 0) / 7 || 1
  return Math.round(((last7 - prev7) / prev7) * 100)
}

export function mockTrends(geo = 'FR') {
  const categories = {}
  for (const cat of TREND_CATEGORIES) {
    categories[cat] = CAT_KEYWORDS[cat].map((keyword) => {
      const series = genSeries('trend::' + cat + '::' + keyword)
      const mom = momentum(series)
      const r = rng('vol::' + keyword)
      return {
        keyword,
        category: cat,
        series,
        momentum: mom,
        direction: mom > 8 ? 'up' : mom < -8 ? 'down' : 'flat',
        volume: r.i(800, 60000),
      }
    })
  }
  // "daily trending searches" feed (what the RSS would return)
  const allKw = TREND_CATEGORIES.flatMap((c) => categories[c])
  const daily = [...allKw]
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, 12)
    .map((k) => ({ title: k.keyword, traffic: `${(k.volume / 1000).toFixed(0)}K+` }))
  return { daily, categories, geo }
}

const REDDIT_TITLES = [
  'First product launched — 14 sales on day one, AMA',
  'Is the air fryer accessory niche too saturated in 2026?',
  'Supplier raised prices 18% overnight, what are my options?',
  'PPC ACoS stuck at 45% — what am I doing wrong?',
  'Found a gap in the pet niche, how do I validate demand?',
  'Hit $10k/month with a single SKU in the kitchen category',
  'Anyone else seeing gua sha tools blow up right now?',
  'My listing got suppressed for "pesticide" keyword — fixed it',
  'Reusable food wrap demand is climbing, worth entering?',
  'Massage guns: returns killing my margin, tips?',
  'How many reviews before you feel safe in a niche?',
  'Q4 prep: stocking up on resistance bands, am I early?',
  'Trademark/brand registry actually worth it for a small brand?',
  'Cat water fountain niche — 3 strong competitors, skip it?',
  'Lip oil trend from TikTok — is it too late to ride it?',
]
const FLAIRS = ['Discussion', 'Seeking Advice', 'Tools', 'Success', 'Inventory Management', null]

export function mockReddit(subs = ['AmazonFBA', 'FulfillmentByAmazon']) {
  const now = Date.now()
  return REDDIT_TITLES.map((title, idx) => {
    const r = rng('reddit::' + title)
    return {
      id: 'mock' + idx,
      title,
      url: 'https://www.reddit.com/r/' + (idx % 2 ? subs[1] || subs[0] : subs[0]),
      ups: r.i(3, 850),
      comments: r.i(0, 220),
      created: now - r.i(1, 23) * 3600 * 1000,
      sub: idx % 2 ? subs[1] || subs[0] : subs[0],
      flair: r.pick(FLAIRS),
    }
  }).sort((a, b) => b.ups - a.ups)
}

const ADJ = ['Premium', 'Eco', 'Compact', 'Pro', 'Reusable', 'Stainless', 'Adjustable']
export function mockBestsellers(cat = 'electronics', count = 20) {
  const map = { electronics: 'Electronics', kitchen: 'Kitchen', sports: 'Sports', beauty: 'Beauty', pets: 'Pets' }
  const display = map[cat] || 'Electronics'
  const kws = CAT_KEYWORDS[display]
  return Array.from({ length: count }, (_, i) => {
    const r = rng('bs::' + cat + '::' + i)
    const keyword = kws[i % kws.length]
    const price = +r.f(8, 80).toFixed(2)
    const bsr = i + 1 + r.i(0, 3)
    const sales = estimateMonthlySales(bsr, display === 'Kitchen' ? 'Kitchen & Dining' : display)
    const revenue = estimateMonthlyRevenue(bsr, price, display)
    return {
      rank: i + 1,
      asin: 'B0' + hashString(cat + i).toString(36).toUpperCase().padStart(8, '0').slice(0, 8),
      title: `${r.pick(ADJ)} ${keyword} ${r.pick(['Set', 'Kit', 'Pack', 'XL'])}`,
      category: display,
      price,
      bsr,
      sales,
      revenue,
      reviews: r.i(20, 5200),
      rating: +r.f(3.6, 4.9).toFixed(1),
      sellers: r.i(1, 20),
      fbaFee: estimateFbaFees(price).total,
      image: `https://picsum.photos/seed/${cat}${i}/120/120`,
      url: '#',
    }
  })
}
