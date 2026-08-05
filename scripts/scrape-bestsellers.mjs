// ---------------------------------------------------------------------------
// Scheduled bestseller scraper — run by .github/workflows/scrape.yml.
//
// Collects the 5 bestseller charts ahead of time and stores them in Supabase,
// so the app reads from stock instead of hitting Amazon while a user waits.
// When Amazon blocks a run, the previous snapshot stays served: users see real
// data with a timestamp, never mock.
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment. The
// service key bypasses RLS (the table grants nobody insert rights) — it must
// live in CI secrets only, never in the bundle.
// ---------------------------------------------------------------------------
import { pickUA, AMAZON_NODES, parseBestsellers } from '../functions/_shared.js'

// A secret pasted without its scheme, or with a stray newline, produces an
// unhelpful "Failed to parse URL" on every insert — normalise and check once.
function normalizeUrl(raw) {
  const s = String(raw || '').trim().replace(/\/+$/, '')
  if (!s) return null
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`
  try {
    return new URL(withScheme).origin
  } catch {
    return null
  }
}

const SUPABASE_URL = normalizeUrl(process.env.SUPABASE_URL)
const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

if (!SUPABASE_URL) {
  console.error('SUPABASE_URL missing or not a valid URL (expected https://<ref>.supabase.co)')
  process.exit(1)
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Amazon blocks datacenter IPs more readily than home connections, and GitHub
// runners are datacenter IPs. A blocked response is usually transient, so give
// each category a second try with a different user-agent before giving up.
async function fetchCategory(cat, attempts = 2) {
  const node = AMAZON_NODES[cat]
  let lastError
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(8000 + Math.random() * 7000)
    try {
      const r = await fetch(`https://www.amazon.fr/gp/bestsellers/${node}`, {
        headers: {
          'User-Agent': pickUA(),
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
          Accept: 'text/html,application/xhtml+xml',
        },
      })
      if (!r.ok) throw new Error(`http_${r.status}`)
      const items = parseBestsellers(await r.text())
      if (items.length < 3) throw new Error('blocked_or_unparseable')
      return items
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

async function insert(rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/bestsellers_snapshots`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  })
  if (!r.ok) throw new Error(`supabase_${r.status}: ${await r.text()}`)
}

// Retention is housekeeping: never let it fail a run that captured good data.
async function prune() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/prune_bestsellers_snapshots`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    if (!r.ok) console.warn(`prune failed: ${r.status}`)
  } catch (e) {
    console.warn(`prune failed: ${e.message}`)
  }
}

const capturedAt = new Date().toISOString()
let ok = 0

for (const cat of Object.keys(AMAZON_NODES)) {
  try {
    const items = await fetchCategory(cat)
    await insert(
      items.map((it, i) => ({
        cat,
        asin: it.asin,
        rank: it.bsr ?? i + 1,
        title: it.title,
        price: it.price,
        rating: it.rating,
        reviews: it.reviews,
        image: it.image,
        captured_at: capturedAt,
      }))
    )
    ok++
    console.log(`${cat}: ${items.length} rows`)
  } catch (e) {
    // One blocked category must not lose the other four.
    console.error(`${cat}: FAILED (${e.message})`)
  }
  // Spread the requests out rather than firing five at once.
  await sleep(5000 + Math.random() * 5000)
}

await prune()

console.log(`${ok}/${Object.keys(AMAZON_NODES).length} categories captured at ${capturedAt}`)
// All five blocked means the run is worthless — fail loudly so the Actions tab shows red.
if (ok === 0) process.exit(1)
