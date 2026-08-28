import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { DashboardShell } from './DashboardShell'

/**
 * Every dashboard route sits behind the login wall, so it renders an empty
 * shell to a crawler. One noindex here covers the whole subtree (robots.txt
 * disallows it too — the meta tag is what removes anything already indexed).
 */
export const metadata: Metadata = pageMetadata({
  title: 'Dashboard',
  description: 'Your Vreato workspace.',
  path: '/dashboard',
  noindex: true,
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
