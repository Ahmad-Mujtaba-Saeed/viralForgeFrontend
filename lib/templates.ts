import {
  TEMPLATES,
  buildTemplatesFromApi,
  type Template,
  type PublicApiTemplate,
} from '@/components/landing/shared/content'

/**
 * The live template list, read once per page at BUILD time (this is a static
 * export, so there is no request-time fetch).
 *
 * Name, description and credit cost come from the backend so an admin can
 * change them without a redeploy; if the API is unreachable while building, the
 * static list in content.ts stands in, so a deploy never ships an empty site.
 *
 * Shared by the landing page and every marketing sub-page so they cannot
 * disagree about what the product offers.
 */
export async function getTemplates(): Promise<Template[]> {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${base}/api/public/landing`, {
      // NOT `no-store`. Every marketing page calls this, the export builds
      // pages across parallel workers, and an uncached call meant each worker
      // raced its own request — so a single timeout gave one page the live
      // template names while its neighbours fell back to the static ones, and
      // a page's <title> could disagree with its own <h1>. Going through
      // Next's build-time data cache makes the whole export read one response.
      next: { revalidate: 3600 },
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timer)
    if (!res.ok) return TEMPLATES
    const data = await res.json()
    const apiTemplates = Array.isArray(data?.templates) ? (data.templates as PublicApiTemplate[]) : null
    return apiTemplates && apiTemplates.length > 0 ? buildTemplatesFromApi(apiTemplates) : TEMPLATES
  } catch {
    return TEMPLATES
  }
}

/**
 * One template's live data, falling back to the static entry.
 *
 * Detail pages are generated for EVERY template in the static list, not just
 * the ones currently enabled in admin: a URL that 404s the moment an admin
 * toggles a switch would lose whatever ranking it had built up. The page still
 * renders, it just shows the static copy.
 */
export async function getTemplate(key: string): Promise<Template | undefined> {
  const live = await getTemplates()
  return live.find((t) => t.key === key) ?? TEMPLATES.find((t) => t.key === key)
}
