import { json, form, stripeApi, getAuthUser, supaSelect } from '../_stripe.js'

// Opens the Stripe billing portal. The customer id is looked up server-side
// from the VERIFIED user's profile — never trusted from the client (otherwise
// anyone could open someone else's billing portal).
export async function onRequestPost({ env, request }) {
  try {
    if (!env.STRIPE_SECRET_KEY) return json({ error: 'stripe_not_configured' }, 503)

    const user = await getAuthUser(env, request)
    if (!user?.id) return json({ error: 'unauthorized' }, 401)

    const rows = await supaSelect(env, 'profiles', `id=eq.${user.id}&select=stripe_customer_id`)
    const customer = rows?.[0]?.stripe_customer_id
    if (!customer) return json({ error: 'no_subscription' }, 400)

    const origin = new URL(request.url).origin
    const { ok, data } = await stripeApi(env, 'billing_portal/sessions', form({ customer, return_url: `${origin}/profile` }))
    if (!ok) return json({ error: data.error?.message || 'stripe_error' }, 400)
    return json({ url: data.url })
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500)
  }
}
