import type { Metadata } from "next"
import { FaqPage } from "./FaqPage"
import { JsonLd } from "@/components/seo/json-ld"
import { FAQS } from "@/components/landing/shared/content"
import { pageMetadata, graph, breadcrumbSchema, faqSchema } from "@/lib/seo"

export const dynamic = "force-static"

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description:
    "Answers about Vreato: what it does, which template to pick, vertical Shorts and widescreen exports, voiceover and captions, how credits work, and how long a render takes.",
  path: "/faq",
})

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          faqSchema(FAQS, "/faq")
        )}
      />
      <FaqPage />
    </>
  )
}
