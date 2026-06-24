import { supabase } from './supabase'

// Stripe is "enabled" in the UI when the publishable key is present at build time.
export const STRIPE_ENABLED = Boolean(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

// POST to a Cloudflare Function with the user's Supabase access token so the
// server can verify identity. The secret key never touches the frontend.
async function authedPost(path, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
    body: JSON.stringify(body || {}),
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(j.error || `http_${res.status}`)
  return j
}

// plan: 'monthly' | 'yearly' -> redirects to Stripe Checkout.
export async function startCheckout(plan) {
  const { url } = await authedPost('/api/create-checkout', { plan })
  if (url) window.location.href = url
}

// Opens the Stripe billing portal (manage card / cancel / invoices).
export async function openBillingPortal() {
  const { url } = await authedPost('/api/customer-portal', {})
  if (url) window.location.href = url
}
