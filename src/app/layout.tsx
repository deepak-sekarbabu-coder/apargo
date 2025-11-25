import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import ClientRoot from '@/components/core/client-root';
import HeadMeta from '@/components/core/head-meta';
import { SkipLink } from '@/components/ui/accessibility';

import './globals.css';

// Configure the Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Define a CSS variable for the font
  display: 'fallback', // Use fallback to avoid preload warnings on pages that don't immediately use the font
});

// Global metadata (Next.js will inject <title> and <meta name="description"> automatically)
export const metadata: Metadata = {
  title: {
    default: 'Apargo – Smart Property & Maintenance Management',
    template: '%s | Apargo',
  },
  description:
    'Apargo is a unified platform for expense tracking, maintenance requests, announcements, polls, and role-based administration for modern property management.',
  applicationName: 'Apargo',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon-32x32.png',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Apargo – Smart Property & Maintenance Management',
    description:
      'Centralize property operations: expenses, maintenance, announcements, polls & more.',
    siteName: 'Apargo',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apargo – Smart Property & Maintenance Management',
    description:
      'Centralize property operations: expenses, maintenance, announcements, polls & more.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <HeadMeta />
      </head>
      <body className={inter.className} suppressHydrationWarning={true} data-hydration-root="true">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        {/* Pre-hydration cleanup of extension-injected attributes (e.g. bis_skin_checked) to avoid hydration mismatches */}
        <Script
          id="extension-attr-cleanup"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(() => {
              const ATTRS = ['bis_skin_checked', 'data-new-gr-c-s-check-loaded', 'data-gr-ext-installed', 'data-new-gr-c-s-loaded', 'grammarly-extension', 'data-lt-installed'];
              
              const clean = () => {
                ATTRS.forEach(attr => {
                  const elements = document.querySelectorAll('[' + attr + ']');
                  elements.forEach(el => {
                    el.removeAttribute(attr);
                  });
                });
              };
              
              // Run immediately and multiple times to catch extensions that inject after DOM ready
              clean();
              
              if (document.readyState !== 'loading') {
                clean();
                // Run again after a small delay to catch delayed injections
                setTimeout(clean, 10);
                setTimeout(clean, 50);
              } else {
                document.addEventListener('DOMContentLoaded', () => {
                  clean();
                  setTimeout(clean, 10);
                  setTimeout(clean, 50);
                }, { once: true });
              }
              
              // Set up mutation observer for continuous cleanup
              const mo = new MutationObserver(mutations => {
                mutations.forEach(mut => {
                  if (mut.type === 'attributes' && mut.attributeName && ATTRS.includes(mut.attributeName)) {
                    mut.target.removeAttribute(mut.attributeName);
                  }
                  if (mut.type === 'childList') {
                    mut.addedNodes.forEach(node => {
                      if (node.nodeType === 1) {
                        ATTRS.forEach(attr => {
                          if (node.hasAttribute && node.hasAttribute(attr)) {
                            node.removeAttribute(attr);
                          }
                          if (node.querySelectorAll) {
                            const children = node.querySelectorAll('[' + attr + ']');
                            children.forEach(child => child.removeAttribute(attr));
                          }
                        });
                      }
                    });
                  }
                });
              });
              
              mo.observe(document.documentElement, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ATTRS
              });
            })();`,
          }}
        />
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
