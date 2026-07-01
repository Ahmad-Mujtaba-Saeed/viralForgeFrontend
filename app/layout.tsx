import type { Metadata } from 'next'
import { Hanken_Grotesk, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { ReduxProvider } from '@/components/providers/ReduxProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
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
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
        <html lang="en" className={`${hankenGrotesk.variable} ${bricolageGrotesque.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        <ReduxProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </AuthProvider>
        </ReduxProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
