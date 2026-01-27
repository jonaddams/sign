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
  const nutrientSdkVersion = process.env.NEXT_PUBLIC_NUTRIENT_SDK_VERSION || '1.10.0';
  const nutrientSdkUrl = `https://cdn.cloud.pspdfkit.com/pspdfkit-web@${nutrientSdkVersion}/nutrient-viewer.js`;

  return (
    <html lang="en" suppressHydrationWarning className={caveat.variable}>
      <head>
        <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />
        <Script id="nutrient-viewer-sdk" src={nutrientSdkUrl} strategy="beforeInteractive" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
