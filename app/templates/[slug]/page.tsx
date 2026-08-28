import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TemplateDetailPage } from "./TemplateDetailPage"
import { JsonLd } from "@/components/seo/json-ld"
import { getTemplates } from "@/lib/templates"
import {
  TEMPLATES,
  TEMPLATE_DETAIL,
  templateSlug,
  templateKeyFromSlug,
  templateImage,
} from "@/components/landing/shared/content"
import {
  pageMetadata,
  graph,
  breadcrumbSchema,
  templateSchema,
  faqSchema,
} from "@/lib/seo"

export const dynamic = "force-static"

/**
 * Generated from the STATIC list, not the live API: an admin toggling a
 * template off must not delete a URL Google has indexed. Every template we
 * ship copy for gets a permanent page.
 */
export function generateStaticParams() {
  return TEMPLATES.filter((t) => TEMPLATE_DETAIL[t.key]).map((t) => ({
    slug: templateSlug(t.key),
  }))
}

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const key = templateKeyFromSlug(slug)
  const detail = TEMPLATE_DETAIL[key]
  if (!detail) return {}

  // Read the SAME source the page body reads. Taking the name from the static
  // list here while the body renders the live one produced a <title> and an
  // <h1> that disagreed whenever the backend copy was older than ours — a
  // mismatch search engines treat as a quality signal, and a confusing page.
  const live = await getTemplates()
  const template = live.find((t) => t.key === key) ?? TEMPLATES.find((t) => t.key === key)
  if (!template) return {}

  const image = templateImage(key)

  return pageMetadata({
    title: template.name,
    // The standfirst is written to double as the meta description: one
    // sentence, specific, and it names what goes in and what comes out.
    description: detail.standfirst,
    path: `/templates/${slug}`,
    ...(image ? { image, imageAlt: `${template.name} — ${template.tagline}` } : {}),
  })
}

export default async function Page({ params }: Params) {
  const { slug } = await params
  const key = templateKeyFromSlug(slug)
  const detail = TEMPLATE_DETAIL[key]
  if (!detail) notFound()

  // Live data where the backend has it (an admin can change the name, copy and
  // credit cost without a redeploy); the static entry is the floor.
  const live = await getTemplates()
  const template = live.find((t) => t.key === key) ?? TEMPLATES.find((t) => t.key === key)
  if (!template) notFound()

  const path = `/templates/${slug}`

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Templates", path: "/templates" },
            { name: template.name, path },
          ]),
          templateSchema({
            name: template.name,
            description: template.description,
            path,
            image: templateImage(key),
          }),
          faqSchema(detail.faqs, path)
        )}
      />
      <TemplateDetailPage template={template} detail={detail} siblings={live} />
    </>
  )
}
