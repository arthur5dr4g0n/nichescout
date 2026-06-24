import { json, form, stripeApi, getAuthUser } from '../_stripe.js'

// Creates a Stripe Checkout session for a 7-day-trial Pro subscription.
// userId/email come from the VERIFIED Supabase token, never from the client body.
export async function onRequestPost({ env, request }) {
  try {
    if (!env.STRIPE_SECRET_KEY) return json({ error: 'stripe_not_configured' }, 503)

    const user = await getAuthUser(env, request)
    if (!user?.id) return json({ error: 'unauthorized' }, 401)

    const { plan } = await request.json().catch(() => ({}))
    const price = plan === 'yearly' ? env.STRIPE_PRICE_YEARLY : env.STRIPE_PRICE_MONTHLY
    if (!price) return json({ error: 'price_not_configured' }, 503)

    const origin = new URL(request.url).origin
    const { ok, data } = await stripeApi(
      env,
      'checkout/sessions',
      form({
        mode: 'subscription',
        customer_email: user.email,
        'line_items[0][price]': price,
        'line_items[0][quantity]': 1,
        success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/payment/cancel`,
        client_reference_id: user.id,
        'metadata[userId]': user.id,
        'subscription_data[metadata][userId]': user.id,
        'subscription_data[trial_period_days]': 7,
        allow_promotion_codes: true,
      }),
    )
    if (!ok) return json({ error: data.error?.message || 'stripe_error' }, 400)
    return json({ url: data.url })
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500)
  }
}
