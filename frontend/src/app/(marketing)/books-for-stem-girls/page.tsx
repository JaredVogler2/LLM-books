import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Personalized STEM Books for Girls | Crayons & Quills',
  description: 'Inspire young girls with personalized STEM adventure books. Custom stories featuring science, technology, engineering, and math.',
  keywords: ['STEM books for girls', 'personalized science book', 'girls in STEM', 'custom educational book'],
};

export default function StemGirlsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-purple-50 to-white py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="font-display text-4xl font-bold text-gray-900 sm:text-5xl">
              STEM Books Where She&apos;s the Scientist
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Spark curiosity with a personalized adventure in science, technology,
              engineering, or math. She&apos;s the hero who solves the puzzle.
            </p>
            <Link href="/book/create" className="btn-primary mt-8 inline-block text-lg px-8 py-4">
              Create a STEM Book
            </Link>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Real Science Concepts', desc: 'Age-appropriate STEM topics woven naturally into exciting stories.' },
                { title: 'Empowering Role Models', desc: 'She leads the experiment, builds the rocket, and saves the day.' },
                { title: 'Beautiful Illustrations', desc: 'Vibrant art showing girls confidently exploring STEM.' },
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
