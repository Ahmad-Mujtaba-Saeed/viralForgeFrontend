import type { Metadata } from "next"
import LandingLiquidGlass from "@/components/landing/variants/liquidglass"
import { TIERS, DEMO_VIDEO } from "@/components/landing/shared/content"
import { getTemplates } from "@/lib/templates"
import { JsonLd } from "@/components/seo/json-ld"
import {
  SITE,
  pageMetadata,
  graph,
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  templateListSchema,
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
// Template data comes from the shared loader so the landing and every marketing
// sub-page read one cached response and cannot disagree about the catalogue.

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
    // No FAQPage node here on purpose: /faq carries it, so exactly one URL is
    // the answer to a question query rather than two competing for it.
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
