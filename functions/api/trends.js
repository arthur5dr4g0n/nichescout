import { pickUA, json } from '../_shared.js'

export async function onRequestGet({ request }) {
  const geo = (new URL(request.url).searchParams.get('geo') || 'FR').replace(/[^A-Za-z]/g, '').slice(0, 4) || 'FR'
  const endpoints = [
    `https://trends.google.com/trending/rss?geo=${geo}`,
    `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
  ]
  try {
    let xml = ''
    let lastStatus = 0
    for (const ep of endpoints) {
      const r = await fetch(ep, { headers: { 'User-Agent': pickUA() } })
      lastStatus = r.status
      if (r.ok) {
        xml = await r.text()
        break
      }
    }
    if (!xml) return json({ error: `trends_http_${lastStatus}` }, 502)
    const items = []
    const re = /<item>([\s\S]*?)<\/item>/g
    let m
    while ((m = re.exec(xml)) && items.length < 25) {
      const block = m[1]
      const title = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1]
      const traffic = (block.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/) || [])[1]
      if (title) items.push({ title: title.trim(), traffic: (traffic || '').trim() })
    }
    if (!items.length) return json({ error: 'trends_empty' }, 502)
    return json({ items, geo })
  } catch (e) {
    return json({ error: 'trends_unreachable', detail: String(e?.message || e) }, 502)
  }
}
