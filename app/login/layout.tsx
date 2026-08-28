import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

/**
 * app/login/page.tsx is a client component, which cannot export metadata.
 * This server-component layout supplies it for the route.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Sign In',
  description: 'Sign in to Vreato to create AI videos — explainers, YouTube Shorts, Reels and TikToks with AI voiceover and captions included.',
  path: '/login',
})

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
