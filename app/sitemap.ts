import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'
import { getTemplates } from '@/lib/templates'
import { TEMPLATE_DETAIL, templateSlug } from '@/components/landing/shared/content'

/**
 * Emitted as a static /sitemap.xml by `output: 'export'`.
 *
 * Only publicly indexable routes are listed — dashboard and editor routes sit
 * behind a login wall and are excluded here as well as in robots.ts, because a
 * sitemap that lists disallowed URLs is reported as an error in Search Console.
 *
 * The template URLs come from the LIVE (enabled-only) list, deliberately the
 * same list the templates hub links to: a sitemap entry with no internal link
 * pointing at it is an orphan, which is crawled less and ranks worse. Pages are
 * still GENERATED for every template we ship copy for (see
 * generateStaticParams), so disabling one in admin never turns an indexed URL
 * into a 404 — it just stops being advertised.
 *
 * `lastModified` is stamped at build time, which is the truth for a static
 * export: the content genuinely cannot change between deploys.
 */
// `output: 'export'` has no server to run this per request, so it must be
// declared static — Next then writes the file once at build time.
export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  const core: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/templates`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/how-it-works`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/faq`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/register`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const templates = await getTemplates()
  const templatePages: MetadataRoute.Sitemap = templates
    .filter((t) => TEMPLATE_DETAIL[t.key])
    .map((t) => ({
      url: `${SITE_URL}/templates/${templateSlug(t.key)}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

  return [...core, ...templatePages]
}
