import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, DM_Sans } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { UserProvider } from '@/hooks/useUser';
import { Toaster } from 'sonner';
import './globals.css';

const space = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f6f0' },
  ],
};

export const metadata: Metadata = {
  title: 'SkillSwap — Peer-to-Peer Skill Barter for College Students',
  description:
    'Exchange skills with fellow students. Teach what you know, learn what you want. No money needed — just skill credits.',
  keywords: ['skill exchange', 'peer learning', 'college', 'barter', 'skill credits'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SkillSwap',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${space.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased" suppressHydrationWarning>
        <QueryProvider>
          <UserProvider>
            {children}
            <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: 'var(--bg-cream)',
                    border: '1px solid var(--border-soft)',
                    color: 'var(--text-primary)',
                  },
                }}
              />
          </UserProvider>
        </QueryProvider>
        
        {/* PWA Service Worker Registration & Dev Cache Cleanup */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for (let reg of registrations) { reg.unregister(); console.log('[SW] Unregistered in dev'); }
                    });
                    if (window.caches) {
                      caches.keys().then(function(names) {
                        for (let name of names) caches.delete(name);
                      });
                    }
                  } else {
                    navigator.serviceWorker.register('/sw.js');
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
