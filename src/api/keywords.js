// Keyword data layer. Real data goes through the authed server proxy
// /api/keywords (DataForSEO creds stay server-side — the browser is
// CORS-blocked by DataForSEO anyway). Mock fallback when unconfigured.
import { USE_MOCK } from '../config'
import { tryLiveAuthed } from './live'
import * as mock from './mockData'

const FALLBACK_ERRORS = ['not_configured', 'offline', 'unauthorized']

function classifyCompetition(score) {
  if (score == null) return 'Medium'
  if (score < 0.34) return 'Low'
  if (score < 0.67) return 'Medium'
  return 'High'
}

export async function keywordResearch(seed) {
  if (USE_MOCK) return mock.keywordResearch(seed)

  let items
  try {
    const j = await tryLiveAuthed('/api/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed }),
      timeout: 30000,
    })
    items = j.items || []
  } catch (e) {
    if (FALLBACK_ERRORS.includes(e.message)) return mock.keywordResearch(seed)
    throw e
  }
  if (!items.length) throw new Error('No keyword data returned.')

  return items
    .map((it) => {
      const score = typeof it.competition_index === 'number' ? it.competition_index / 100 : null
      return {
        keyword: it.keyword,
        volume: it.search_volume || 0,
        competition: classifyCompetition(score),
        competitionScore: score ?? 0.5,
        cpc: it.cpc ? +Number(it.cpc).toFixed(2) : 0,
        trend: 'flat',
        spark: (it.monthly_searches || [])
          .slice(0, 6)
          .reverse()
          .map((m) => ({ month: String(m.month), value: m.search_volume || 0 })),
      }
    })
    .sort((a, b) => b.volume - a.volume)
}
