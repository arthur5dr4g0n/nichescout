// ---------------------------------------------------------------------------
// Business-logic estimates: BSR -> sales, FBA fees, and the Niche Score.
// These are heuristics (same idea tools like JungleScout use), NOT exact
// Amazon figures. Good enough to compare products and spot opportunities.
// ---------------------------------------------------------------------------
import { clamp, mean } from './format'

// Rough per-category multipliers — busier categories sell more at the same BSR.
const CATEGORY_FACTORS = {
  'Electronics': 1.2,
  'Home & Kitchen': 1.5,
  'Toys & Games': 1.0,
  'Sports & Outdoors': 0.9,
  'Beauty & Personal Care': 1.3,
  'Office Products': 0.8,
  'Pet Supplies': 1.1,
  'Kitchen & Dining': 1.4,
  'Health & Household': 1.25,
  default: 1.0,
}

export const CATEGORIES = Object.keys(CATEGORY_FACTORS).filter((c) => c !== 'default')

// Power-law BSR -> estimated monthly unit sales.
// rank #1 ≈ tens of thousands/mo; rank 100k ≈ a handful/mo.
export function estimateMonthlySales(bsr, category = 'default') {
  if (!bsr || bsr <= 0) return 0
  const factor = CATEGORY_FACTORS[category] ?? CATEGORY_FACTORS.default
  const sales = factor * 100000 * Math.pow(bsr, -0.75)
  return Math.max(0, Math.round(sales))
}

export function estimateMonthlyRevenue(bsr, price, category = 'default') {
  return Math.round(estimateMonthlySales(bsr, category) * (price || 0))
}

// Simplified FBA cost: 15% referral fee + a size/weight fulfillment fee.
export function estimateFbaFees(price = 0, weightLb = 0.75) {
  const referral = +(price * 0.15).toFixed(2)
  let fulfillment
  if (weightLb <= 0.5) fulfillment = 3.06
  else if (weightLb <= 1) fulfillment = 3.4
  else if (weightLb <= 2) fulfillment = 4.2
  else fulfillment = +(4.2 + (weightLb - 2) * 0.4).toFixed(2)
  const total = +(referral + fulfillment).toFixed(2)
  return { referral, fulfillment, total }
}

// Estimated profit margin after FBA fees (gross, before product cost).
export function estimateMargin(price) {
  if (!price) return 0
  const { total } = estimateFbaFees(price)
  return clamp(((price - total) / price) * 100, -100, 100)
}

// ---------------------------------------------------------------------------
// Niche Score (0-100). Blends three signals from a set of products:
//   - competition  (fewer reviews  = easier to enter)
//   - profitability (higher revenue = worth it; target > $5,000/mo)
//   - price sweet-spot ($15–$70 is ideal for FBA margins)
// ---------------------------------------------------------------------------
export function nicheScore(products = []) {
  if (!products.length) {
    return { score: 0, color: 'gray', label: 'No data', breakdown: null }
  }

  const avgReviews = mean(products.map((p) => p.reviews || 0))
  const avgRevenue = mean(products.map((p) => p.revenue || 0))
  const avgPrice = mean(products.map((p) => p.price || 0))

  // Competition: 0 reviews -> 100, ~1000+ reviews -> 0. <200 stays strong.
  const reviewScore = clamp(100 - (avgReviews / 1000) * 100, 0, 100)

  // Profitability: $0 -> 0, $5,000 -> 50, $10,000+ -> 100.
  const revenueScore = clamp((avgRevenue / 10000) * 100, 0, 100)

  // Price sweet-spot: full marks inside $15–$70, tapering outside.
  let priceScore
  if (avgPrice >= 15 && avgPrice <= 70) priceScore = 100
  else if (avgPrice < 15) priceScore = clamp((avgPrice / 15) * 100, 0, 100)
  else priceScore = clamp(100 - ((avgPrice - 70) / 70) * 100, 0, 100)

  const score = Math.round(reviewScore * 0.4 + revenueScore * 0.35 + priceScore * 0.25)
  const color = score >= 70 ? 'green' : score >= 40 ? 'orange' : 'red'
  const label = score >= 70 ? 'Strong opportunity' : score >= 40 ? 'Worth a look' : 'Tough niche'

  return {
    score,
    color,
    label,
    breakdown: {
      avgReviews: Math.round(avgReviews),
      avgRevenue: Math.round(avgRevenue),
      avgPrice: +avgPrice.toFixed(2),
      reviewScore: Math.round(reviewScore),
      revenueScore: Math.round(revenueScore),
      priceScore: Math.round(priceScore),
    },
  }
}
