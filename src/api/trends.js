// Google Trends. Daily trending searches come live from the RSS feed (via the
// dev proxy); per-category momentum + 30-day series are modeled (the public RSS
// can't supply them without pytrends). Falls back fully to mock when blocked.
import { tryLive } from './live'
import { mockTrends } from './mockSignals'

export async function fetchTrends(geo = 'FR') {
  const modeled = mockTrends(geo)
  try {
    const j = await tryLive(`/api/trends?geo=${encodeURIComponent(geo)}`)
    const liveDaily = Array.isArray(j.items) && j.items.length > 0
    return {
      data: { daily: liveDaily ? j.items.slice(0, 12) : modeled.daily, categories: modeled.categories, geo, liveDaily },
      source: liveDaily ? 'live' : 'mock',
    }
  } catch {
    return { data: { ...modeled, liveDaily: false }, source: 'mock' }
  }
}
