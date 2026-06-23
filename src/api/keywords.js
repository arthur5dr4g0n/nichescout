// Keyword data layer. Mock by default; DataForSEO when configured.
// NOTE: DataForSEO is server-to-server and commonly blocks browser calls via
// CORS. If you hit a CORS error in real mode, route this through a small proxy
// (or a serverless function). Mock mode is recommended for keyword research.
import axios from 'axios'
import { USE_MOCK, DATAFORSEO_READY, DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD } from '../config'
import * as mock from './mockData'

const useRealKeywords = !USE_MOCK && DATAFORSEO_READY

function classifyCompetition(score) {
  if (score == null) return 'Medium'
  if (score < 0.34) return 'Low'
  if (score < 0.67) return 'Medium'
  return 'High'
}

export async function keywordResearch(seed) {
  if (!useRealKeywords) return mock.keywordResearch(seed)

  const auth = btoa(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`)
  const { data } = await axios.post(
    'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live',
    [{ keywords: [seed], location_code: 2840, language_code: 'en', limit: 18 }],
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, timeout: 25000 },
  )

  const items = data?.tasks?.[0]?.result || []
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
