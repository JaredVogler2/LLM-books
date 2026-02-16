import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative isolate overflow-hidden bg-gradient-to-b from-primary-50 to-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Where Every Child Is the
                <span className="text-primary-600"> Hero</span> of Their Own Story
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Create a one-of-a-kind, professionally printed children&apos;s book
                starring your child. Powered by AI, crafted with love.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/book/create" className="btn-primary text-lg px-8 py-4">
                  Create Your Book
                </Link>
                <Link href="#how-it-works" className="btn-secondary">
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
                Three Simple Steps
              </h2>
            </div>
            <div className="mx-auto mt-16 max-w-5xl">
              <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                {[
                  {
                    step: '1',
                    title: 'Tell Us About Your Child',
                    description: 'Share their name, age, interests, and personality. Upload a photo for character likeness.',
                  },
                  {
                    step: '2',
                    title: 'Choose Your Book',
                    description: 'Pick a story type, illustration style, binding, and any extras like audiobook or gift wrap.',
                  },
                  {
                    step: '3',
                    title: 'We Create & Ship',
                    description: 'Our AI creates a unique story and illustrations. A beautiful book arrives at your door.',
                  },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-display text-2xl font-bold">
                      {item.step}
                    </div>
                    <h3 className="mt-6 font-display text-xl font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
                Simple Pricing
              </h2>
              <p className="mt-4 text-gray-600">One-time purchase or subscribe for recurring magic.</p>
            </div>
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  name: 'Single Book',
                  price: '$24.99',
                  period: 'one-time',
                  features: ['24-page personalized book', 'Full color illustrations', 'Softcover binding', 'Free standard shipping'],
                },
                {
                  name: 'Birthday Club',
                  price: '$19.99',
                  period: '/year',
                  features: ['New book every birthday', 'Updated for their age', '15% off retail price', 'Free shipping always'],
                  popular: true,
                },
                {
                  name: 'Adventure Series',
                  price: '$17.99',
                  period: '/quarter',
                  features: ['New book every 3 months', 'Continuing character arc', '25% off retail price', 'Priority printing'],
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`card ${plan.popular ? 'ring-2 ring-primary-600 relative' : ''}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-display text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="h-5 w-5 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/book/create"
                    className={`mt-8 block w-full text-center ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-primary-600">
          <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Every Child Deserves a Story Made Just for Them
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Join thousands of parents creating unforgettable reading experiences.
            </p>
            <Link href="/book/create" className="mt-8 inline-block btn-accent text-lg px-10 py-4">
              Start Creating Now
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
