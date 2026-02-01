import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe only if the key is available
const getStripe = () => {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(apiKey, {
    apiVersion: '2026-01-28.clover',
  });
};

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const { amount, currency = 'usd', bookingId } = body;

    // TODO: Validate amount and booking details
    // TODO: Check if booking exists in Supabase
    // TODO: Ensure user is authenticated

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: currency,
      metadata: {
        bookingId: bookingId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
