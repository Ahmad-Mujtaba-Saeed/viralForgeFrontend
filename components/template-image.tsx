import { templateImage } from "@/components/landing/shared/content"

/**
 * A template's card artwork, served WebP-first with a JPEG fallback.
 *
 * Both formats sit side by side in public/templates. The static export runs
 * with `images.unoptimized`, so next/image cannot resize or re-encode anything
 * at build time — this <picture> is what actually saves the bytes on pages
 * whose LCP feeds Core Web Vitals.
 *
 * `display: contents` on the <picture> keeps it out of the layout box tree, so
 * the <img> lays out exactly as a bare <img> with the same className would.
 *
 * Returns null when we have no artwork for the key, so callers can fall back to
 * the generative TemplateArt for a template added after this art was made.
 */
export function TemplateImage({
  templateType,
  alt,
  className = "h-full w-full object-cover",
  /** Decorative uses pass alt="" and should also be hidden from the a11y tree. */
  decorative = false,
  priority = false,
}: {
  templateType: string
  alt: string
  className?: string
  decorative?: boolean
  priority?: boolean
}) {
  const src = templateImage(templateType)
  if (!src) return null

  return (
    <picture className="contents">
      <source srcSet={src.replace(/\.jpg$/, ".webp")} type="image/webp" />
      <img
        src={src}
        alt={decorative ? "" : alt}
        aria-hidden={decorative || undefined}
        width={900}
        height={675}
        loading={priority ? "eager" : "lazy"}
        // The hero card's art is above the fold on most viewports, so it is
        // fetched at high priority rather than lazily.
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={className}
      />
    </picture>
  )
}
