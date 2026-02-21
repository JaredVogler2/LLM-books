'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Book } from '@/types';

// ─── Shipping Address Form ────────────────────────────────────────────

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

// ─── Stripe Payment Form (inner component) ───────────────────────────

function PaymentForm({
  orderId,
  totalCents,
  bookId,
}: {
  orderId: string;
  totalCents: number;
  bookId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setPaymentError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/confirmation/${orderId}`,
      },
    });

    if (error) {
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
    // If no error, Stripe redirects to return_url automatically
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
        <div className="rounded-xl border border-gray-200 p-4">
          <PaymentElement />
        </div>
      </div>

      {paymentError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {paymentError}
        </div>
      )}

      <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Payments are securely processed by Stripe. We never see your card details.
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn-primary w-full text-base py-4 disabled:opacity-50"
      >
        {processing ? 'Processing Payment...' : `Pay ${formatPrice(totalCents)}`}
      </button>
    </form>
  );
}

// ─── Main Checkout Page ──────────────────────────────────────────────

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shipping
  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [couponCode, setCouponCode] = useState('');

  // Order & Payment
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Load book details
  useEffect(() => {
    async function loadBook() {
      try {
        const bookData = await api.getBook(bookId);
        setBook(bookData);
      } catch {
        setError('Could not load book details. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [bookId]);

  // Price estimate
  const estimatedPrice = useMemo(() => {
    if (!book) return 0;
    let total = 0;
    if (book.pageCount <= 12) total += 1999;
    else if (book.pageCount <= 24) total += 2499;
    else total += 3499;
    if (book.bindingType === 'HARDCOVER') total += 1000;
    if (book.paperType === 'PREMIUM_MATTE') total += 500;
    else if (book.paperType === 'GLOSSY') total += 800;
    if (book.bookSize === 'PORTRAIT_8_5X11' || book.bookSize === 'LANDSCAPE_11X8_5') total += 300;
    return total;
  }, [book]);

  const shippingCost = shippingMethod === 'express' ? 1299 : 599;

  const isAddressValid = address.name && address.line1 && address.city && address.state && address.postalCode;

  const handleCreateOrder = async () => {
    if (!isAddressValid) return;
    setCreatingOrder(true);
    setError(null);

    try {
      // Create the order
      const order = await api.createOrder({
        items: [{ bookId }],
        shippingAddress: {
          name: address.name,
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        },
        shippingMethod,
        couponCode: couponCode || undefined,
      });

      setOrderId(order.id);
      setOrderTotal(order.totalCents);

      // Create payment intent
      const payment = await api.createPayment(order.id);
      setClientSecret(payment.clientSecret);
      setStripePublishableKey(payment.publishableKey);

      // Move to payment step
      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'Could not create order. Please try again.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const stripePromise = useMemo(
    () => (stripePublishableKey ? loadStripe(stripePublishableKey) : null),
    [stripePublishableKey],
  );

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading checkout...</p>
          </div>
        </main>
      </>
    );
  }

  if (error && !book) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="card text-center max-w-md">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => router.push('/book/create')} className="btn-primary">
              Start Over
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-12">
          {/* Checkout Progress */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold text-gray-900">Checkout</h1>
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-primary-600' : 'text-green-600'}`}>
                <span className={`wizard-step ${step === 'shipping' ? 'wizard-step-active' : 'wizard-step-complete'}`}>
                  {step === 'payment' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : '1'}
                </span>
                <span className="text-sm font-medium">Shipping</span>
              </div>
              <div className="w-12 h-px bg-gray-300"></div>
              <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-primary-600' : 'text-gray-400'}`}>
                <span className={`wizard-step ${step === 'payment' ? 'wizard-step-active' : 'wizard-step-pending'}`}>2</span>
                <span className="text-sm font-medium">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column — Form */}
            <div className="lg:col-span-2 space-y-6">
              {step === 'shipping' && (
                <div className="card space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      className="input"
                      placeholder="Jane Smith"
                      value={address.name}
                      onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                    <input
                      className="input"
                      placeholder="123 Main Street"
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (optional)</label>
                    <input
                      className="input"
                      placeholder="Apt 4B"
                      value={address.line2}
                      onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        className="input"
                        placeholder="Charleston"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        className="input"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      >
                        <option value="">Select state</option>
                        {US_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input
                        className="input"
                        placeholder="29401"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        className="input"
                        value={address.country}
                        onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      >
                        <option value="US">United States</option>
                      </select>
                    </div>
                  </div>

                  {/* Shipping Method */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Shipping Method</h4>
                    <div className="space-y-3">
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        shippingMethod === 'standard' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === 'standard'}
                          onChange={() => setShippingMethod('standard')}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">Standard Shipping</span>
                          <p className="text-xs text-gray-500">7-14 business days</p>
                        </div>
                        <span className="font-semibold text-gray-900">$5.99</span>
                      </label>
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        shippingMethod === 'express' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === 'express'}
                          onChange={() => setShippingMethod('express')}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">Express Shipping</span>
                          <p className="text-xs text-gray-500">3-5 business days</p>
                        </div>
                        <span className="font-semibold text-gray-900">$12.99</span>
                      </label>
                    </div>
                  </div>

                  {/* Coupon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code (optional)</label>
                    <input
                      className="input"
                      placeholder="WELCOME10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleCreateOrder}
                    disabled={!isAddressValid || creatingOrder}
                    className="btn-primary w-full text-base py-4 disabled:opacity-50"
                  >
                    {creatingOrder ? 'Creating Order...' : 'Continue to Payment'}
                  </button>
                </div>
              )}

              {step === 'payment' && clientSecret && stripePromise && orderId && (
                <div className="card">
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#6d28d9',
                          borderRadius: '12px',
                        },
                      },
                    }}
                  >
                    <PaymentForm orderId={orderId} totalCents={orderTotal} bookId={bookId} />
                  </Elements>
                </div>
              )}
            </div>

            {/* Right Column — Order Summary (always visible) */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>

                {book && (
                  <>
                    {/* Book preview */}
                    <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                      <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {book.coverImageUrl ? (
                          <img src={book.coverImageUrl} alt="Book cover" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          Personalized Book for {book.childProfile?.name || 'Your Child'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {book.pageCount} pages &bull; {book.bindingType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {book.paperType.replace(/_/g, ' ')} &bull; {book.bookSize.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Book</span>
                        <span className="text-gray-900">{formatPrice(estimatedPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping ({shippingMethod})</span>
                        <span className="text-gray-900">{formatPrice(shippingCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (estimated)</span>
                        <span className="text-gray-900">{formatPrice(Math.round(estimatedPrice * 0.08))}</span>
                      </div>
                      <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
                        <span className="text-gray-900">Total</span>
                        <span className="text-primary-900 text-lg">
                          {orderTotal > 0
                            ? formatPrice(orderTotal)
                            : formatPrice(estimatedPrice + shippingCost + Math.round(estimatedPrice * 0.08))}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Trust badges */}
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    SSL Encrypted &amp; Secure
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    Free returns within 30 days
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    Made with love, just for your child
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
