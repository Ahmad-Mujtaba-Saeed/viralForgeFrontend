import type { Metadata } from "next"
import { HowItWorksPage } from "./HowItWorksPage"
import { JsonLd } from "@/components/seo/json-ld"
import { getTemplates } from "@/lib/templates"
import { SITE_URL, pageMetadata, graph, breadcrumbSchema } from "@/lib/seo"
import { STEPS } from "@/components/landing/shared/content"

export const dynamic = "force-static"

export const metadata: Metadata = pageMetadata({
  title: "How It Works",
  description:
    "How Vreato turns a script, a prompt or a video link into a finished video: scene planning, AI visuals, studio voiceover, word-timed captions, music and the final render.",
  path: "/how-it-works",
})

export default async function Page() {
  const templates = await getTemplates()

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "How it works", path: "/how-it-works" },
          ]),
          // A genuine three-step procedure, so HowTo is the honest type here.
          {
            "@type": "HowTo",
            "@id": `${SITE_URL}/how-it-works#howto`,
            name: "How to make a video with Vreato",
            description:
              "Pick a template, give it a script, a prompt or a link, and download the finished video.",
            step: STEPS.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s.title,
              text: s.description,
              url: `${SITE_URL}/how-it-works#step-${i + 1}`,
            })),
          }
        )}
      />
      <HowItWorksPage templates={templates} />
    </>
  )
}
