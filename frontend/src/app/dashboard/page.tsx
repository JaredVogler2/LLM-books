'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { Book, Order } from '@/types';

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

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [booksData, ordersData] = await Promise.all([
          api.getBooks(),
          api.getOrders(),
        ]);
        setBooks(booksData);
        setOrders(ordersData);
      } catch {
        // User not authenticated — redirect
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-3xl font-bold text-gray-900">My Books</h1>
            <Link href="/book/create" className="btn-primary">
              Create New Book
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading...</div>
          ) : books.length === 0 ? (
            <div className="card text-center py-16">
              <h2 className="font-display text-xl font-semibold text-gray-900">No Books Yet</h2>
              <p className="mt-2 text-gray-600">Create your first personalized book!</p>
              <Link href="/book/create" className="btn-primary mt-6 inline-block">
                Get Started
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <div key={book.id} className="card hover:shadow-xl transition-shadow">
                  <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-4">
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt={book.title || 'Book cover'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-gray-900">
                    {book.title || 'Untitled Book'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    For {book.childProfile?.name} &bull; {book.pageCount} pages
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[book.status] || 'bg-gray-100'}`}>
                      {book.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(book.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Orders Section */}
          {orders.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Orders</h2>
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Order</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4">{formatDate(order.createdAt)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{formatPrice(order.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
