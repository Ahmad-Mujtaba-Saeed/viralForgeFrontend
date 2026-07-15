import LandingLiquidGlass from "@/components/landing/variants/liquidglass"
import { TEMPLATES, buildTemplatesFromApi, type Template, type PublicApiTemplate } from "@/components/landing/shared/content"

// Re-read live template data on every request so admin changes (credit cost,
// enabled/disabled, trending) show on the marketing page without a rebuild.
export const dynamic = "force-dynamic"

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
  return <LandingLiquidGlass templates={templates} />
}
