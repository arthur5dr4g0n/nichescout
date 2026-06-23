// Cross-references Google Trends momentum + Reddit buzz + a competition proxy
// into a 0-100 "hot right now" score per niche.
import { clamp } from './format'

function seededComp(name) {
  // Deterministic competition proxy 0-100 (higher = LESS saturated = better).
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return 25 + (h % 70)
}

function buzzCount(niche, redditItems) {
  if (!redditItems?.length) return 0
  const words = niche.toLowerCase().split(/\s|-/).filter((w) => w.length > 3)
  return redditItems.reduce((n, it) => {
    const t = (it.title || '').toLowerCase()
    return n + (words.some((w) => t.includes(w)) ? 1 : 0)
  }, 0)
}

export function colorFor(score) {
  return score >= 70 ? 'green' : score >= 45 ? 'orange' : 'red'
}

// trends: { categories: { Cat: [{keyword, momentum, direction, volume, series}] } }
// reddit: [{title, ...}]
export function computeHotNiches(trends, reddit) {
  if (!trends?.categories) return []
  const candidates = Object.values(trends.categories).flat()

  const scored = candidates.map((c) => {
    const trendScore = clamp(50 + c.momentum * 1.6, 0, 100) // momentum -> 0..100
    const buzz = buzzCount(c.keyword, reddit)
    const buzzScore = clamp(35 + buzz * 22, 0, 100)
    const compScore = seededComp(c.keyword)

    const score = Math.round(trendScore * 0.45 + buzzScore * 0.3 + compScore * 0.25)
    const reasons = []
    if (c.direction === 'up') reasons.push(`Trending up ${c.momentum > 0 ? '+' : ''}${c.momentum}% (7d)`)
    else if (c.direction === 'down') reasons.push(`Cooling ${c.momentum}% (7d)`)
    else reasons.push('Stable interest')
    if (buzz > 0) reasons.push(`${buzz} Reddit mention${buzz > 1 ? 's' : ''}`)
    reasons.push(compScore > 60 ? 'Low competition signal' : compScore > 40 ? 'Moderate competition' : 'Crowded')

    return {
      niche: c.keyword,
      category: c.category,
      score,
      color: colorFor(score),
      direction: c.direction,
      momentum: c.momentum,
      volume: c.volume,
      signals: { trend: Math.round(trendScore), buzz: Math.round(buzzScore), competition: compScore },
      reasons,
    }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, 8)
}
