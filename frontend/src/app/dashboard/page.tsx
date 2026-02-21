'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { Book, Order, User } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  GENERATING_STORY: 'Writing Story',
  GENERATING_ILLUSTRATIONS: 'Creating Art',
  ASSEMBLING_PDF: 'Building PDF',
  REVIEW_READY: 'Ready to Review',
  APPROVED: 'Approved',
  SENT_TO_PRINT: 'Sent to Print',
  PRINTING: 'Printing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  GENERATING_STORY: 'bg-blue-100 text-blue-700',
  GENERATING_ILLUSTRATIONS: 'bg-blue-100 text-blue-700',
  ASSEMBLING_PDF: 'bg-yellow-100 text-yellow-700',
  REVIEW_READY: 'bg-green-100 text-green-700',
  APPROVED: 'bg-green-100 text-green-700',
  SENT_TO_PRINT: 'bg-purple-100 text-purple-700',
  PRINTING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  GENERATING_STORY: 'Our AI is writing a unique story just for your child. This takes about 5 minutes.',
  GENERATING_ILLUSTRATIONS: 'Custom illustrations are being created for each page. This takes about 15 minutes.',
  ASSEMBLING_PDF: 'The story and art are being combined into a beautiful book layout.',
  REVIEW_READY: 'Your book is ready! Review it and approve for printing.',
  SENT_TO_PRINT: 'Your book has been sent to our print partner for production.',
  PRINTING: 'Your book is on the press. Quality printing takes 2-3 business days.',
  SHIPPED: 'Your book is on its way! Check your email for tracking info.',
  DELIVERED: 'Your book has been delivered. Enjoy reading together!',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  REFUNDED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
};

function isGenerating(status: string) {
  return ['GENERATING_STORY', 'GENERATING_ILLUSTRATIONS', 'ASSEMBLING_PDF'].includes(status);
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'books' | 'orders'>('books');

  useEffect(() => {
    async function load() {
      try {
        const [userData, booksData, ordersData] = await Promise.all([
          api.getProfile(),
          api.getBooks(),
          api.getOrders(),
        ]);
        setUser(userData);
        setBooks(booksData);
        setOrders(ordersData);
      } catch {
        router.push('/auth/login');
        return;
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  // Auto-refresh books that are generating
  useEffect(() => {
    const generating = books.some((b) => isGenerating(b.status));
    if (!generating) return;

    const interval = setInterval(async () => {
      try {
        const booksData = await api.getBooks();
        setBooks(booksData);
      } catch {
        // Silently fail on refresh
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [books]);

  const handleLogout = () => {
    api.clearToken();
    router.push('/');
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading your dashboard...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          {/* Welcome Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-900">
                {user?.firstName ? `Hi, ${user.firstName}!` : 'My Dashboard'}
              </h1>
              <p className="text-gray-500 mt-1">Manage your personalized books and orders.</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/book/create" className="btn-primary">
                Create New Book
              </Link>
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
                Sign Out
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 max-w-xs">
            <button
              onClick={() => setActiveTab('books')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'books' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Books ({books.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Orders ({orders.length})
            </button>
          </div>

          {/* Books Tab */}
          {activeTab === 'books' && (
            <>
              {books.length === 0 ? (
                <div className="card text-center py-16">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <h2 className="font-display text-xl font-semibold text-gray-900">No Books Yet</h2>
                  <p className="mt-2 text-gray-600">Create your first personalized book and watch the magic happen!</p>
                  <Link href="/book/create" className="btn-primary mt-6 inline-block">
                    Create Your First Book
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {books.map((book) => (
                    <div key={book.id} className="card hover:shadow-xl transition-shadow">
                      {/* Cover Image */}
                      <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-4 relative">
                        {book.coverImageUrl ? (
                          <img
                            src={book.coverImageUrl}
                            alt={book.title || 'Book cover'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            {isGenerating(book.status) ? (
                              <>
                                <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mb-3"></div>
                                <p className="text-xs text-gray-500">Creating your book...</p>
                              </>
                            ) : (
                              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                              </svg>
                            )}
                          </div>
                        )}
                        {/* Status badge overlay */}
                        <div className="absolute top-3 right-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shadow-sm ${STATUS_COLORS[book.status] || 'bg-gray-100'}`}>
                            {STATUS_LABELS[book.status] || book.status}
                          </span>
                        </div>
                      </div>

                      {/* Book Info */}
                      <h3 className="font-display text-lg font-semibold text-gray-900">
                        {book.title || `Book for ${book.childProfile?.name || 'Your Child'}`}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        For {book.childProfile?.name || 'your child'} &bull; {book.pageCount} pages &bull; {book.bindingType.replace(/_/g, ' ')}
                      </p>

                      {/* Status description */}
                      {STATUS_DESCRIPTIONS[book.status] && (
                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">
                          {STATUS_DESCRIPTIONS[book.status]}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        {book.status === 'DRAFT' && (
                          <Link href={`/checkout/${book.id}`} className="btn-primary text-xs py-2 px-4 flex-1 text-center">
                            Complete Purchase
                          </Link>
                        )}
                        {book.status === 'REVIEW_READY' && book.printPdfUrl && (
                          <a href={book.printPdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-2 px-4 flex-1 text-center">
                            Preview Book
                          </a>
                        )}
                        {book.digitalPdfUrl && (
                          <a href={book.digitalPdfUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-2 px-4">
                            Download PDF
                          </a>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-gray-400">
                        Created {formatDate(book.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              {orders.length === 0 ? (
                <div className="card text-center py-16">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <h2 className="font-display text-xl font-semibold text-gray-900">No Orders Yet</h2>
                  <p className="mt-2 text-gray-600">Your order history will appear here once you purchase a book.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="card">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-display font-semibold text-gray-900">
                              Order #{order.id.slice(0, 8)}
                            </h3>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className="font-semibold text-gray-900 text-lg">{formatPrice(order.totalCents)}</span>
                      </div>

                      {/* Order Items */}
                      <div className="divide-y divide-gray-100">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-4 py-3">
                            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {item.book?.coverImageUrl ? (
                                <img src={item.book.coverImageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {item.book?.title || `Book for ${item.book?.childProfile?.name || 'your child'}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                Qty: {item.quantity} &bull; {formatPrice(item.unitPrice)} each
                              </p>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{formatPrice(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Price Breakdown */}
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
                        <div className="flex justify-between text-gray-500">
                          <span>Subtotal</span>
                          <span>{formatPrice(order.subtotalCents)}</span>
                        </div>
                        {order.discountCents > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-{formatPrice(order.discountCents)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-500">
                          <span>Shipping</span>
                          <span>{formatPrice(order.shippingCents)}</span>
                        </div>
                        {order.taxCents > 0 && (
                          <div className="flex justify-between text-gray-500">
                            <span>Tax</span>
                            <span>{formatPrice(order.taxCents)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
