import type { Metadata } from 'next'
import { Hanken_Grotesk, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { ReduxProvider } from '@/components/providers/ReduxProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import { SkinProvider } from '@/components/providers/SkinProvider'
import { DEFAULT_SKIN, SKIN_INIT_SCRIPT, isSkin, type Skin } from '@/lib/skins'
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
  title: 'ViralForge - AI-Powered Video Content Creation',
  description: 'Transform your ideas into viral video content with AI-powered automation. Create, edit, and publish engaging videos in minutes.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
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
