import type { Metadata } from 'next';
import { Inter, Fredoka } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'StoryForge AI - Personalized Children\'s Books',
  description: 'Create magical, personalized children\'s books with AI. Unique stories featuring your child as the hero.',
  keywords: ['children\'s books', 'personalized books', 'AI books', 'custom storybook', 'kids gifts'],
  openGraph: {
    title: 'StoryForge AI - Personalized Children\'s Books',
    description: 'Create magical, personalized children\'s books with AI.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fredoka.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
