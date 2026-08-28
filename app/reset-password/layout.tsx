import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

/**
 * app/reset-password/page.tsx is a client component, which cannot export metadata.
 * This server-component layout supplies it for the route.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Choose a New Password',
  description: 'Set a new password for your Vreato account.',
  path: '/reset-password',
  noindex: true,
})

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
