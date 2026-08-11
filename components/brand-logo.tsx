import { cn } from '@/lib/utils'

/**
 * The Vreato logo — the single place the brand artwork is referenced.
 *
 * The wordmark PNGs already contain the name, so a BrandLogo REPLACES the old
 * "icon lozenge + <span>ViralForge</span>" pair rather than sitting next to it.
 *
 * Theme handling is pure CSS: both wordmarks are emitted and one is hidden with
 * the `dark:` variant. Reading the theme in JS instead would either flash the
 * wrong logo on first paint or mismatch during hydration, since the theme is
 * only known in the browser.
 *
 * `tone` overrides that for surfaces whose colours do NOT follow the app theme
 * — the landing variants hardcode their palettes (Liquid Glass is permanently
 * light, Cinematic permanently dark), so they must pin the matching wordmark.
 *
 * Assets live in public/brand/ and are trimmed, resized derivatives of the
 * supplied artwork: the originals are 1536x1024 canvases with the logo adrift
 * in a wide transparent margin, which renders about 8px tall in a header.
 */

/** Intrinsic size of the trimmed wordmark, for the width/height attributes. */
const WORDMARK = { w: 376, h: 96 }

export function BrandLogo({
  height = 28,
  tone = 'auto',
  className,
}: {
  /** Rendered height in px; width follows the artwork's aspect ratio. */
  height?: number
  /** 'auto' follows the app theme; pin it on a fixed-palette surface. */
  tone?: 'auto' | 'light' | 'dark'
  className?: string
}) {
  const width = Math.round((WORDMARK.w / WORDMARK.h) * height)
  const common = 'block w-auto select-none'
  const dims = { width, height }

  if (tone !== 'auto') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={tone === 'dark' ? '/brand/logo-dark.png' : '/brand/logo-light.png'}
        alt="Vreato"
        {...dims}
        className={cn(common, className)}
        style={{ height }}
      />
    )
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-light.png"
        alt="Vreato"
        {...dims}
        className={cn(common, 'dark:hidden', className)}
        style={{ height }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-dark.png"
        alt="Vreato"
        {...dims}
        aria-hidden
        className={cn(common, 'hidden dark:block', className)}
        style={{ height }}
      />
    </>
  )
}

/**
 * The V mark alone, for square slots — a collapsed sidebar, an avatar-sized
 * badge. It is a colour gradient on transparency, so one file serves both
 * themes.
 */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/mark-180.png"
      alt="Vreato"
      width={size}
      height={size}
      className={cn('block select-none', className)}
      style={{ width: size, height: size }}
    />
  )
}
