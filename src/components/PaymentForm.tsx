'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface PaymentFormProps {
  amount: number;
  bookingId: string;
}

export function PaymentForm({ amount, bookingId }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          bookingId: bookingId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // TODO: Implement Stripe Elements for card collection
      // const stripe = await stripePromise;
      // const { error: stripeError } = await stripe.confirmPayment({
      //   clientSecret,
      //   confirmParams: {
      //     return_url: `${window.location.origin}/booking/confirmation`,
      //   },
      // });

      console.log('Payment intent created:', clientSecret);
      setError('TODO: Implement Stripe Elements for card input');
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
      <div className="mb-4">
        <p className="text-gray-600 dark:text-gray-400">
          Total Amount: <span className="font-bold">${amount.toFixed(2)}</span>
        </p>
      </div>

      {/* TODO: Add Stripe Elements components here */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-8 text-center mb-4">
        <p className="text-gray-500 dark:text-gray-400">
          Stripe Elements Card Input Placeholder
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          TODO: Integrate @stripe/react-stripe-js for card collection
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </div>
  );
}
