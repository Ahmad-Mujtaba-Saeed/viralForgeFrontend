import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Emitted as a static /robots.txt by `output: 'export'`.
 *
 * Everything behind the login wall is disallowed: those routes render an empty
 * shell to a crawler (the data arrives from the API after auth), so indexing
 * them would only publish thin, duplicate pages. `/api/` covers the Next route
 * handlers that exist purely for uploads and proxying.
 */
// `output: 'export'` has no server to run this per request, so it must be
// declared static — Next then writes the file once at build time.
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/editor',
          '/editor/',
          '/reset-password',
          '/reset-password/',
          '/forgot-password',
          '/forgot-password/',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
