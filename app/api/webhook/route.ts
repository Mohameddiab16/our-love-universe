import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getExpiresAt(sub: any): string {
  const end = sub.current_period_end ?? sub.billing_cycle_anchor
  return new Date(end * 1000).toISOString()
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, plan } = session.metadata || {}
    if (!userId || !plan) return NextResponse.json({ ok: true })

    const sub = await stripe.subscriptions.retrieve(session.subscription as string) as any
    const expiresAt = getExpiresAt(sub)

    await supabaseAdmin.from('user_subscriptions').upsert({
      user_id: userId,
      plan,
      expires_at: expiresAt,
      stripe_subscription_id: sub.id,
      stripe_customer_id: session.customer as string,
    }, { onConflict: 'user_id' })
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = (sub as any).metadata?.userId
    if (userId) {
      await supabaseAdmin.from('user_subscriptions')
        .update({ plan: 'free', expires_at: new Date().toISOString() })
        .eq('user_id', userId)
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as any
    const subId = invoice.subscription as string
    if (!subId) return NextResponse.json({ ok: true })
    const sub = await stripe.subscriptions.retrieve(subId) as any
    const userId = sub.metadata?.userId
    const plan = sub.metadata?.plan
    if (userId && plan) {
      const expiresAt = getExpiresAt(sub)
      await supabaseAdmin.from('user_subscriptions').update({ expires_at: expiresAt })
        .eq('user_id', userId)
    }
  }

  return NextResponse.json({ ok: true })
}
