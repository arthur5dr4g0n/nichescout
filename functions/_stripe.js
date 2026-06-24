// Shared helpers for the Stripe Cloudflare Functions (Workers runtime).
// We call the Stripe REST API directly via fetch (the node `stripe` SDK's
// require()/crypto don't run on Workers) and verify webhook signatures with
// Web Crypto. The Stripe secret + Supabase service key live ONLY here, server-side.

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}

export function form(obj) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== null) p.set(k, String(v))
  return p
}

export async function stripeApi(env, path, params) {
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

// Verify the caller's Supabase access token and return the real user (id+email).
// Never trust a userId sent by the client.
export async function getAuthUser(env, request) {
  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!token) return null
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_KEY },
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

// Service-key REST helpers (server-side only).
export async function supaSelect(env, table, query) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
  })
  return res.ok ? res.json().catch(() => []) : []
}

export async function supaPatch(env, table, query, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  })
  return res.ok
}

// Idempotency: record an event id; returns true if it was a DUPLICATE.
export async function isDuplicateEvent(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/stripe_events`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=representation',
    },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) return false // table missing -> don't block (still process once)
  const rows = await res.json().catch(() => [])
  return Array.isArray(rows) && rows.length === 0 // empty => the id already existed
}

// Verify a Stripe webhook signature (scheme: t=timestamp,v1=hex-hmac-sha256).
export async function verifyStripeSignature(payload, header, secret) {
  if (!header || !secret) return false
  const parts = {}
  for (const kv of header.split(',')) {
    const i = kv.indexOf('=')
    if (i > 0) parts[kv.slice(0, i)] = kv.slice(i + 1)
  }
  if (!parts.t || !parts.v1) return false
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false // 5-min tolerance
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${parts.t}.${payload}`))
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
  // constant-time compare
  if (expected.length !== parts.v1.length) return false
  let r = 0
  for (let i = 0; i < expected.length; i++) r |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i)
  return r === 0
}
