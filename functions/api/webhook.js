import { json, supaPatch, isDuplicateEvent, verifyStripeSignature } from '../_stripe.js'

// Stripe -> MarketMax. The ONLY place that grants/revokes Pro.
// Security: verifies the signature, uses the service key, derives userId from
// Stripe metadata (set server-side at checkout), and is idempotent.
export async function onRequestPost({ env, request }) {
  const sig = request.headers.get('stripe-signature')
  const body = await request.text() // raw body required for signature check

  const valid = await verifyStripeSignature(body, sig, env.STRIPE_WEBHOOK_SECRET)
  if (!valid) return new Response('invalid signature', { status: 400 })

  let event
  try {
    event = JSON.parse(body)
  } catch {
    return new Response('bad payload', { status: 400 })
  }

  // Idempotency — never upgrade twice for the same event.
  if (await isDuplicateEvent(env, event.id)) return json({ received: true, duplicate: true })

  try {
    const o = event.data.object
    switch (event.type) {
      case 'checkout.session.completed': {
        const userId = o.metadata?.userId || o.client_reference_id
        if (userId) {
          await supaPatch(env, 'profiles', `id=eq.${userId}`, {
            plan: 'pro',
            stripe_customer_id: o.customer,
            stripe_subscription_id: o.subscription,
            plan_expires_at: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }
        break
      }
      case 'customer.subscription.updated': {
        const active = ['active', 'trialing'].includes(o.status)
        await supaPatch(env, 'profiles', `stripe_customer_id=eq.${o.customer}`, {
          plan: active ? 'pro' : 'free',
          stripe_subscription_id: o.id,
          plan_expires_at: o.current_period_end ? new Date(o.current_period_end * 1000).toISOString() : null,
        })
        break
      }
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        await supaPatch(env, 'profiles', `stripe_customer_id=eq.${o.customer}`, {
          plan: 'free',
          plan_expires_at: null,
        })
        break
      }
      default:
        break
    }
  } catch (e) {
    // Return 500 so Stripe retries (and idempotency stops a double-apply).
    return json({ error: String(e?.message || e) }, 500)
  }

  return json({ received: true })
}
