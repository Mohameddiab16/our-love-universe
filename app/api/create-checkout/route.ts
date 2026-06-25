import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })

const PRICES: Record<string, { priceId: string; name: string }> = {
  solo: {
    priceId: process.env.STRIPE_PRICE_SOLO!,
    name: 'خطة الفردي 👤',
  },
  couple: {
    priceId: process.env.STRIPE_PRICE_COUPLE!,
    name: 'خطة الثنائي 💑',
  },
  family: {
    priceId: process.env.STRIPE_PRICE_FAMILY!,
    name: 'خطة العائلي 👨‍👩‍👧‍👦',
  },
}

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, userEmail } = await req.json()

    if (!plan || !userId || !PRICES[plan]) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    const planConfig = PRICES[plan]

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?success=1&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?canceled=1`,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
        trial_period_days: 30,
      },
      locale: 'auto',
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
