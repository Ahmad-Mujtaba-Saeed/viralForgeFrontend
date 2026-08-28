import type { Metadata } from "next"
import { PricingPage } from "./PricingPage"
import { JsonLd } from "@/components/seo/json-ld"
import { getTemplates } from "@/lib/templates"
import { TIERS } from "@/components/landing/shared/content"
import {
  pageMetadata,
  graph,
  breadcrumbSchema,
  softwareApplicationSchema,
} from "@/lib/seo"

export const dynamic = "force-static"

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  description:
    "Vreato pricing: credits that refill every day, every template on every plan, AI voiceover and captions included at no extra cost. Plans from $10/month.",
  path: "/pricing",
})

export default async function Page() {
  const templates = await getTemplates()

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
          // The offers node lives here as well as on the home page: this is the
          // URL a price rich-result should point at.
          softwareApplicationSchema(TIERS)
        )}
      />
      <PricingPage templates={templates} />
    </>
  )
}
