import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Personalized Books for Soccer Kids | Crayons & Quills',
  description: 'Create a custom children\'s book starring your soccer-loving child. Personalized stories featuring their name, team colors, and favorite soccer adventures.',
  keywords: ['soccer books for kids', 'personalized soccer book', 'custom children\'s book soccer'],
};

export default function SoccerKidsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-green-50 to-white py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="font-display text-4xl font-bold text-gray-900 sm:text-5xl">
              Personalized Books for Soccer Kids
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Score the perfect gift! A one-of-a-kind storybook where your child
              is the soccer star, complete with their name, team colors, and real adventures on the field.
            </p>
            <Link href="/book/create" className="btn-primary mt-8 inline-block text-lg px-8 py-4">
              Create a Soccer Book
            </Link>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-display text-2xl font-bold text-gray-900 text-center mb-12">
              What Makes Our Soccer Books Special
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Their Name, Their Story', desc: 'Your child is the main character, scoring goals and leading the team.' },
                { title: 'Custom Illustrations', desc: 'AI-generated art that can match your child\'s appearance.' },
                { title: 'Real Life Lessons', desc: 'Stories that teach teamwork, perseverance, and sportsmanship.' },
              ].map((item) => (
                <div key={item.title} className="card text-center">
                  <h3 className="font-display text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
