import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#faf5eb',
};

export const metadata: Metadata = {
  title: 'Raga Finder AI - Discover Carnatic & Hindustani Ragas',
  description:
    'Intelligent Raga Finder powered by OpenAI and ground-truth musicologist training. Identify Indian classical ragas by swaras, song titles, or notes with precision audio synthesis.',
  keywords: [
    'Raga Finder',
    'Carnatic Ragas',
    'Hindustani Ragas',
    'OpenAI Raga Identification',
    '72 Melakarta',
    'Swaras',
    'Arohana Avarohana',
    'Indian Classical Music',
  ],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Raga Finder',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-music-pattern text-stone-900 selection:bg-amber-200 selection:text-amber-900 pb-16 md:pb-0">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
