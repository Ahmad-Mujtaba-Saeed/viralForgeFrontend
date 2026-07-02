import LandingEditorial from "@/components/landing/variants/editorial"
import LandingCinematic from "@/components/landing/variants/cinematic"
import LandingMinimal from "@/components/landing/variants/minimal"

// Re-read the admin-selected variant on every request so a switch in
// Settings takes effect immediately (no rebuild, no client-side flash).
export const dynamic = "force-dynamic"

type Variant = "editorial" | "cinematic" | "minimal"

const VARIANTS: Variant[] = ["editorial", "cinematic", "minimal"]

async function getVariant(): Promise<Variant> {
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
    if (!res.ok) return "editorial"
    const data = await res.json()
    return VARIANTS.includes(data?.variant) ? (data.variant as Variant) : "editorial"
  } catch {
    // Backend unreachable at render time — fall back to the default design.
    return "editorial"
  }
}

export default async function Home() {
  const variant = await getVariant()

  if (variant === "cinematic") return <LandingCinematic />
  if (variant === "minimal") return <LandingMinimal />
  return <LandingEditorial />
}
