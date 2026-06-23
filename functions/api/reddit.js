import { REDDIT_UA, parseRedditRss, json } from '../_shared.js'

export async function onRequestGet({ request }) {
  const sub = (new URL(request.url).searchParams.get('sub') || 'AmazonFBA').replace(/[^a-zA-Z0-9_]/g, '')
  // 1) JSON API (richest: scores + comment counts).
  try {
    const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25&raw_json=1`, {
      headers: { 'User-Agent': REDDIT_UA, Accept: 'application/json' },
    })
    if (r.ok) {
      const j = await r.json()
      const items = (j?.data?.children || [])
        .map((c) => c.data)
        .filter((d) => d && !d.stickied)
        .map((d) => ({
          id: d.id,
          title: d.title,
          url: 'https://www.reddit.com' + d.permalink,
          ups: d.ups || 0,
          comments: d.num_comments || 0,
          created: (d.created_utc || 0) * 1000,
          sub: d.subreddit,
          flair: d.link_flair_text || null,
        }))
      if (items.length) return json({ items })
    }
  } catch {
    /* fall through to RSS */
  }
  // 2) Atom RSS fallback (often less restricted; no scores).
  try {
    const r = await fetch(`https://www.reddit.com/r/${sub}/hot.rss?limit=25`, {
      headers: { 'User-Agent': REDDIT_UA, Accept: 'application/rss+xml, application/atom+xml' },
    })
    if (!r.ok) return json({ error: `reddit_http_${r.status}` }, 502)
    const items = parseRedditRss(await r.text(), sub)
    if (!items.length) return json({ error: 'reddit_empty' }, 502)
    return json({ items })
  } catch (e) {
    return json({ error: 'reddit_unreachable', detail: String(e?.message || e) }, 502)
  }
}
