import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Personalized Dinosaur Books for Kids | StoryForge AI',
  description: 'Create a custom dinosaur adventure book starring your child. Personalized stories with T-Rex, Triceratops, and more.',
  keywords: ['dinosaur books for kids', 'personalized dinosaur book', 'custom dinosaur story'],
};

export default function DinosaurLoversPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-amber-50 to-white py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="font-display text-4xl font-bold text-gray-900 sm:text-5xl">
              Dinosaur Adventures With Your Child as the Explorer
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Take your little paleontologist on a prehistoric journey! A personalized
              storybook where they discover, name, and befriend incredible dinosaurs.
            </p>
            <Link href="/book/create" className="btn-primary mt-8 inline-block text-lg px-8 py-4">
              Create a Dinosaur Book
            </Link>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Dino Facts Included', desc: 'Real dinosaur facts mixed into the adventure for educational value.' },
                { title: 'Their Dino Friend', desc: 'Your child befriends a dinosaur companion throughout the story.' },
                { title: 'Stunning Prehistoric Art', desc: 'Lush, detailed illustrations of dinosaurs and ancient landscapes.' },
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
