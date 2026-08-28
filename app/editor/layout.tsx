import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

/**
 * The editor is an authenticated app screen — nothing meaningful renders for a
 * crawler, so it is kept out of the index alongside the dashboard.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Editor',
  description: 'Vreato video editor.',
  path: '/editor',
  noindex: true,
})

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
