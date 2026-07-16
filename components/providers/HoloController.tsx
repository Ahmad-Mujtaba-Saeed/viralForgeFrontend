'use client'

import { useEffect } from 'react'

/**
 * Drives the cursor-following holographic sheen on `.holo` cards.
 *
 * One passive document-level pointer listener updates the `--hx`/`--hy` custom
 * properties on whichever `.holo` element is under the cursor; the sheen itself
 * is a pure-CSS `::after` gradient (see globals.css) that reads those vars. This
 * keeps it cheap — no per-card React state or listeners — so it scales to every
 * card in the app. Mounted once, globally, from SkinProvider.
 */
export function HoloController() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      const el = target?.closest?.('.holo') as HTMLElement | null
      if (!el) return
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--hx', `${e.clientX - rect.left}px`)
      el.style.setProperty('--hy', `${e.clientY - rect.top}px`)
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => document.removeEventListener('pointermove', onMove)
  }, [])

  return null
}
