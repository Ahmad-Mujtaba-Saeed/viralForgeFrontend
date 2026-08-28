import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

/**
 * app/forgot-password/page.tsx is a client component, which cannot export metadata.
 * This server-component layout supplies it for the route.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Reset Your Password',
  description: 'Request a password reset link for your Vreato account.',
  path: '/forgot-password',
  noindex: true,
})

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
