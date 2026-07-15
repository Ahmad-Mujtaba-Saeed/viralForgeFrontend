import LandingEditorial from "@/components/landing/variants/editorial"
import LandingCinematic from "@/components/landing/variants/cinematic"
import LandingMinimal from "@/components/landing/variants/minimal"
import LandingAurora from "@/components/landing/variants/aurora"
import LandingLiquidGlass from "@/components/landing/variants/liquidglass"
import { TEMPLATES, buildTemplatesFromApi, type Template, type PublicApiTemplate } from "@/components/landing/shared/content"

// Re-read the admin-selected variant on every request so a switch in
// Settings takes effect immediately (no rebuild, no client-side flash).
export const dynamic = "force-dynamic"

type Variant = "editorial" | "cinematic" | "minimal" | "aurora" | "prism"

const VARIANTS: Variant[] = ["editorial", "cinematic", "minimal", "aurora", "prism"]

async function getLandingData(): Promise<{ variant: Variant; templates: Template[] }> {
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
    if (!res.ok) return { variant: "editorial", templates: TEMPLATES }
    const data = await res.json()
    const variant = VARIANTS.includes(data?.variant) ? (data.variant as Variant) : "editorial"
    const apiTemplates = Array.isArray(data?.templates) ? (data.templates as PublicApiTemplate[]) : null
    const templates = apiTemplates && apiTemplates.length > 0 ? buildTemplatesFromApi(apiTemplates) : TEMPLATES
    return { variant, templates }
  } catch {
    // Backend unreachable at render time — fall back to the default design + static copy.
    return { variant: "editorial", templates: TEMPLATES }
  }
}

export default async function Home() {
  const { variant, templates } = await getLandingData()

  if (variant === "prism") return <LandingLiquidGlass templates={templates} />
  if (variant === "aurora") return <LandingAurora templates={templates} />
  if (variant === "cinematic") return <LandingCinematic templates={templates} />
  if (variant === "minimal") return <LandingMinimal templates={templates} />
  return <LandingEditorial templates={templates} />
}
