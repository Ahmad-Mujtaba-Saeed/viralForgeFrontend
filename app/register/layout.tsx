import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

/**
 * app/register/page.tsx is a client component, which cannot export metadata.
 * This server-component layout supplies it for the route.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Create a Free Account',
  description: 'Create a free Vreato account and start turning scripts, prompts and video links into post-ready AI videos. Credits refill daily, no card required.',
  path: '/register',
})

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
