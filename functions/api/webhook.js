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
        // past_due = paiement échoué mais Stripe relance (dunning) -> on garde Pro en période de grâce.
        const active = ['active', 'trialing', 'past_due'].includes(o.status)
        // L'API Stripe récente a déplacé current_period_end sur l'item -> fallback.
        const periodEnd = o.current_period_end ?? o.items?.data?.[0]?.current_period_end
        await supaPatch(env, 'profiles', `stripe_customer_id=eq.${o.customer}`, {
          plan: active ? 'pro' : 'free',
          stripe_subscription_id: o.id,
          plan_expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        })
        break
      }
      // Révocation dure UNIQUEMENT à l'annulation de l'abonnement.
      // (Pas sur invoice.payment_failed : Stripe relance ~2 semaines avant d'abandonner.)
      case 'customer.subscription.deleted': {
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
