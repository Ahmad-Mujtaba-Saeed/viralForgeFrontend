import type { Metadata } from "next"
import { TemplatesHub } from "./TemplatesHub"
import { JsonLd } from "@/components/seo/json-ld"
import { getTemplates } from "@/lib/templates"
import { templateSlug } from "@/components/landing/shared/content"
import {
  SITE_URL,
  pageMetadata,
  graph,
  breadcrumbSchema,
  templateListSchema,
} from "@/lib/seo"

export const dynamic = "force-static"

export const metadata: Metadata = pageMetadata({
  title: "AI Video Templates",
  description:
    "Seven AI video templates: explainer videos, faceless YouTube Shorts, video-to-shorts, ranking countdowns, compilations and AI story shorts. Voiceover and captions included.",
  path: "/templates",
})

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Templates", path: "/templates" },
          ]),
          // The same catalogue the home page lists, but here each item points at
          // its own page rather than back at an anchor.
          {
            ...templateListSchema(templates, "/templates"),
            itemListElement: templates.map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}/templates/${templateSlug(t.key)}`,
              name: t.name,
            })),
          }
        )}
      />
      <TemplatesHub templates={templates} />
    </>
  )
}
