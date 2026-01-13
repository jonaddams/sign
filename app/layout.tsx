import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Caveat, Inter } from 'next/font/google';
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/contexts/theme-context';

const inter = Inter({ subsets: ['latin'] });
const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-signature',
});

export const metadata: Metadata = {
  title: 'Nutrient Sign - Document Signing Made Simple',
  description: 'Securely sign, send, and manage your documents from anywhere.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={caveat.variable}>
      <head>
        <Script
          id="nutrient-viewer-sdk"
          src="https://cdn.cloud.pspdfkit.com/pspdfkit-web@1.2.0/nutrient-viewer.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
