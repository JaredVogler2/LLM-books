import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Product</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/book/create" className="text-sm hover:text-white">Create a Book</Link></li>
              <li><Link href="#how-it-works" className="text-sm hover:text-white">How It Works</Link></li>
              <li><Link href="/pricing" className="text-sm hover:text-white">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Categories</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/books-for-soccer-kids" className="text-sm hover:text-white">Soccer Kids</Link></li>
              <li><Link href="/books-for-stem-girls" className="text-sm hover:text-white">STEM Girls</Link></li>
              <li><Link href="/books-for-dinosaur-lovers" className="text-sm hover:text-white">Dinosaur Lovers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/about" className="text-sm hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="text-sm hover:text-white">Contact</Link></li>
              <li><Link href="/affiliates" className="text-sm hover:text-white">Affiliates</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/privacy" className="text-sm hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm hover:text-white">Terms of Service</Link></li>
              <li><Link href="/coppa" className="text-sm hover:text-white">COPPA Notice</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center">
          <p className="text-sm">Crayons &amp; Quills, an Atman Labs LLC product. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
