import './global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import { Background } from '@/components/Background';

export const metadata = {
  title: {
    default: 'termprompt',
    template: '%s | termprompt',
  },
  description:
    'Beautiful terminal prompts with zero dependencies. Interactive select, confirm, input, multiselect, password, and search. OSC 7770 protocol for smart terminal hosts.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Background />
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
