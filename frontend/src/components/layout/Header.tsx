'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-primary-600">
            Crayons &amp; Quills
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">
            How It Works
          </Link>
          <Link href="/book/create" className="text-sm text-gray-600 hover:text-gray-900">
            Create a Book
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            My Books
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Sign In
          </Link>
          <Link href="/book/create" className="btn-primary text-sm">
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-4">
          <Link href="/book/create" className="block text-sm text-gray-600">Create a Book</Link>
          <Link href="/dashboard" className="block text-sm text-gray-600">My Books</Link>
          <Link href="/auth/login" className="block text-sm text-gray-600">Sign In</Link>
          <Link href="/book/create" className="btn-primary block text-center text-sm">Get Started</Link>
        </div>
      )}
    </header>
  );
}
