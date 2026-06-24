import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-05-28.basil' })

const PRICES: Record<string, { priceId: string; name: string }> = {
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

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{ price: PRICES[plan].priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?success=1&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?canceled=1`,
      metadata: { userId, plan },
      subscription_data: { metadata: { userId, plan } },
      locale: 'ar',
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
