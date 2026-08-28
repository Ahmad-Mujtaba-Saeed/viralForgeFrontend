import type { Metadata } from "next"
import LandingLiquidGlass from "@/components/landing/variants/liquidglass"
import {
  TEMPLATES,
  TIERS,
  FAQS,
  DEMO_VIDEO,
  buildTemplatesFromApi,
  type Template,
  type PublicApiTemplate,
} from "@/components/landing/shared/content"
import { JsonLd } from "@/components/seo/json-ld"
import {
  SITE,
  pageMetadata,
  graph,
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  templateListSchema,
  faqSchema,
  videoSchema,
} from "@/lib/seo"

// Re-read live template data on build so static export succeeds.
export const dynamic = "force-static"

export const metadata: Metadata = {
  ...pageMetadata({
    // Home overrides the layout's `%s | Vreato` template — the brand is already
    // in the string, and repeating it would push the title past the SERP limit.
    title: `${SITE.name} — AI Video Generator for Shorts, Reels & Explainers`,
    description: SITE.description,
    path: "/",
  }),
  title: {
    absolute: `${SITE.name} — AI Video Generator for Shorts, Reels & Explainers`,
  },
}

// Liquid Glass is the single shipped landing design — the editorial, cinematic,
// minimal and aurora variants remain in the codebase but are no longer served.
async function getTemplates(): Promise<Template[]> {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(`${base}/api/public/landing`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    clearTimeout(timer)
    if (!res.ok) return TEMPLATES
    const data = await res.json()
    const apiTemplates = Array.isArray(data?.templates) ? (data.templates as PublicApiTemplate[]) : null
    return apiTemplates && apiTemplates.length > 0 ? buildTemplatesFromApi(apiTemplates) : TEMPLATES
  } catch {
    // Backend unreachable at render time — fall back to the static copy.
    return TEMPLATES
  }
}

export default async function Home() {
  const templates = await getTemplates()

  // One @graph rather than several loose scripts, so the nodes can reference
  // each other by @id. The VideoObject only joins once a real demo file is
  // configured — schema for a video that does not exist is a rich-result error.
  const nodes: object[] = [
    organizationSchema(),
    websiteSchema(),
    softwareApplicationSchema(TIERS),
    templateListSchema(templates),
    faqSchema(FAQS),
  ]

  if (DEMO_VIDEO.enabled && DEMO_VIDEO.uploadDate) {
    nodes.push(
      videoSchema({
        name: DEMO_VIDEO.title,
        description: DEMO_VIDEO.description,
        thumbnailUrl: DEMO_VIDEO.poster,
        contentUrl: DEMO_VIDEO.src,
        uploadDate: DEMO_VIDEO.uploadDate,
        duration: DEMO_VIDEO.duration,
      })
    )
  }

  return (
    <>
      <JsonLd data={graph(...nodes)} />
      <LandingLiquidGlass templates={templates} />
    </>
  )
}
