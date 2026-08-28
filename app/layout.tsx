import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { ReduxProvider } from '@/components/providers/ReduxProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import { SkinProvider } from '@/components/providers/SkinProvider'
import { DEFAULT_SKIN, SKIN_INIT_SCRIPT, isSkin, type Skin } from '@/lib/skins'
import { SITE, SITE_URL, SITE_KEYWORDS } from '@/lib/seo'
import './globals.css'

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ['400', '500', '600', '700'],
})

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ['500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  // Every relative URL in child-route metadata resolves against this, so
  // canonicals and OG images come out absolute in the static export.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — AI Video Generator for Shorts, Reels & Explainers`,
    // Child pages set only their own title; the brand is appended here so no
    // page has to repeat it and none exceeds the ~60-char SERP limit.
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.name,
  category: 'technology',
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE_URL,
    title: `${SITE.name} — AI Video Generator for Shorts, Reels & Explainers`,
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.ogImageAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitter,
    creator: SITE.twitter,
    title: `${SITE.name} — AI Video Generator for Shorts, Reels & Explainers`,
    description: SITE.description,
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  formatDetection: { telephone: false, address: false, email: false },
  // The V mark is a gradient on transparency, so one icon reads on both a
  // light and a dark tab strip — no prefers-color-scheme pair needed.
  icons: {
    icon: [
      { url: '/brand/mark-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/mark-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/brand/mark-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/brand/mark-180.png',
  },
  manifest: '/manifest.webmanifest',
  // Fill these in from Search Console / Bing Webmaster once the domain is
  // verified; an empty string would emit a meta tag with no content.
  // verification: { google: '', other: { 'msvalidate.01': '' } },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EAEEF9' },
    { media: '(prefers-color-scheme: dark)', color: '#0E1030' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
}

/**
 * The admin-selected default skin, for visitors who haven't picked their own.
 * Stamped onto <html> during SSR so the first paint is already correct; the
 * inline script below then applies a stored personal choice over the top.
 */
async function getDefaultSkin(): Promise<Skin> {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  try {
    // This runs in the ROOT layout, so it is on the critical path of every
    // page. A slow or wedged backend must never hang the whole app — bail out
    // fast and fall back, same as the landing page's variant fetch does.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(`${base}/api/public/landing`, {
      next: { revalidate: 60 },
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timer)
    if (!res.ok) return DEFAULT_SKIN
    const data = await res.json()
    return isSkin(data?.theme) ? data.theme : DEFAULT_SKIN
  } catch {
    return DEFAULT_SKIN
  }
}

/** Origin of the API, for the connection-warming hints in <head>. */
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const defaultSkin = await getDefaultSkin()

  return (
    <html
      lang="en"
      data-theme={defaultSkin}
      className={`${hankenGrotesk.variable} ${bricolageGrotesque.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* The API origin is hit on first paint by the auth bootstrap, so warm
            the connection rather than paying DNS + TLS inside the LCP window. */}
        <link rel="preconnect" href={BACKEND_ORIGIN} crossOrigin="" />
        <link rel="dns-prefetch" href={BACKEND_ORIGIN} />
        <script dangerouslySetInnerHTML={{ __html: SKIN_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-background">
        <ReduxProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <SkinProvider defaultSkin={defaultSkin}>
                {children}
                <Toaster position="top-right" richColors />
              </SkinProvider>
            </ThemeProvider>
          </AuthProvider>
        </ReduxProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
