import type { Metadata } from 'next';
import { Cinzel, Inter, Plus_Jakarta_Sans, Share_Tech_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
});

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-share-tech',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MINYX — Ton compagnon IA évolutif',
  description: 'Ton compagnon IA qui se souvient de toi et grandit avec toi.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`dark ${inter.variable} ${jakarta.variable} ${cinzel.variable} ${shareTechMono.variable}`}
    >
      <body className="min-h-screen bg-[#0a0a0f] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
