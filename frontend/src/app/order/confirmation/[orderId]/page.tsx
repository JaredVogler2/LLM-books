'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;
  const paymentStatus = searchParams.get('redirect_status');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [generationStarted, setGenerationStarted] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const orderData = await api.getOrder(orderId);
        setOrder(orderData);

        // If payment succeeded, start book generation for each book in the order
        if (paymentStatus === 'succeeded' && !generationStarted) {
          setGenerationStarted(true);
          for (const item of orderData.items || []) {
            try {
              await api.startGeneration(item.bookId);
            } catch {
              // Generation may have already been started — that's OK
            }
          }
        }
      } catch {
        // Order may still be processing
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId, paymentStatus, generationStarted]);

  const isSuccess = paymentStatus === 'succeeded';
  const isFailed = paymentStatus === 'failed';

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Confirming your order...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-6 py-12">
          {isSuccess ? (
            <>
              {/* Success Header */}
              <div className="text-center mb-12">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h1 className="font-display text-3xl font-bold text-gray-900">
                  Thank You for Your Order!
                </h1>
                <p className="mt-4 text-gray-600 max-w-lg mx-auto">
                  Your payment was successful and our AI is now creating a one-of-a-kind book.
                  We&apos;ll email you updates as your book progresses.
                </p>
              </div>

              {/* What Happens Next */}
              <div className="card mb-8">
                <h2 className="font-display text-lg font-semibold text-gray-900 mb-6">What Happens Next</h2>
                <div className="space-y-6">
                  {[
                    {
                      step: '1',
                      title: 'AI Story Generation',
                      description: 'Our AI is writing a unique, personalized story right now. This takes about 5-10 minutes.',
                      status: 'active',
                    },
                    {
                      step: '2',
                      title: 'Illustration Creation',
                      description: 'Custom illustrations are generated for each page, featuring your child as the hero.',
                      status: 'upcoming',
                    },
                    {
                      step: '3',
                      title: 'Book Assembly & Review',
                      description: 'The story and illustrations are assembled into a print-ready book. You\'ll get an email to review it.',
                      status: 'upcoming',
                    },
                    {
                      step: '4',
                      title: 'Printing & Shipping',
                      description: 'Once approved, your book is professionally printed and shipped to your door.',
                      status: 'upcoming',
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        item.status === 'active'
                          ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {item.status === 'active' ? (
                          <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse"></div>
                        ) : (
                          item.step
                        )}
                      </div>
                      <div>
                        <h3 className={`font-medium ${item.status === 'active' ? 'text-gray-900' : 'text-gray-500'}`}>
                          {item.title}
                        </h3>
                        <p className={`text-sm mt-0.5 ${item.status === 'active' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Details */}
              {order && (
                <div className="card mb-8">
                  <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order ID</span>
                      <span className="text-gray-900 font-mono">{order.id.slice(0, 12)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="text-gray-900">{formatDate(order.createdAt)}</span>
                    </div>
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-gray-500">
                          Book for {item.book?.childProfile?.name || 'your child'}
                        </span>
                        <span className="text-gray-900">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping</span>
                      <span className="text-gray-900">{formatPrice(order.shippingCents)}</span>
                    </div>
                    {order.taxCents > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tax</span>
                        <span className="text-gray-900">{formatPrice(order.taxCents)}</span>
                      </div>
                    )}
                    {order.discountCents > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(order.discountCents)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-primary-900 text-lg">{formatPrice(order.totalCents)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard" className="btn-primary text-center">
                  Go to My Books
                </Link>
                <Link href="/book/create" className="btn-secondary text-center">
                  Create Another Book
                </Link>
              </div>
            </>
          ) : isFailed ? (
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-bold text-gray-900">Payment Failed</h1>
              <p className="mt-4 text-gray-600 max-w-lg mx-auto">
                We couldn&apos;t process your payment. Please check your card details and try again.
                You have not been charged.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => window.history.back()} className="btn-primary">
                  Try Again
                </button>
                <Link href="/book/create" className="btn-secondary text-center">
                  Start Over
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <div className="animate-spin w-8 h-8 border-4 border-yellow-200 border-t-yellow-600 rounded-full"></div>
              </div>
              <h1 className="font-display text-3xl font-bold text-gray-900">Processing Payment</h1>
              <p className="mt-4 text-gray-600">
                Your payment is being processed. This page will update automatically.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
