import { Inter } from 'next/font/google';
import './globals.css';
import RootLayoutClient from '@/components/layout/RootLayoutClient';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PACT - Personalized Adaptive Coding Tutor',
  description: 'AI-powered personalized learning platform for programming education',
  keywords: 'coding, programming, adaptive learning, AI tutor, Python, Java, JavaScript',
  authors: [{ name: 'PACT Team' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}