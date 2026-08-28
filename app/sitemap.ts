import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Emitted as a static /sitemap.xml by `output: 'export'`.
 *
 * Only publicly indexable routes are listed. The app itself is a single
 * marketing page plus the two auth entry points — dashboard routes are behind a
 * login wall and are excluded here as well as in robots.ts, because a sitemap
 * that lists disallowed URLs is reported as an error in Search Console.
 *
 * `lastModified` is stamped at build time, which is the truth for a static
 * export: the content genuinely cannot change between deploys.
 */
// `output: 'export'` has no server to run this per request, so it must be
// declared static — Next then writes the file once at build time.
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
