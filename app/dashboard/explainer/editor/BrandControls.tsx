'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { Storyboard } from './types'

/** Brand kit controls (§10.4): logo watermark upload + brand colour, with the
 *  contrast notice when the colour was ignored. */
export function BrandControls({
  board, onLogo, onColor, logoPending, colorPending,
}: {
  board: Storyboard
  onLogo: (file: File | null, remove?: boolean) => void
  onColor: (color: string) => void
  logoPending?: boolean
  colorPending?: boolean
}) {
  const logoRef = useRef<HTMLInputElement>(null)
  const [color, setColor] = useState(board.brand?.color ?? '#ffffff')
  useEffect(() => {
    if (board.brand?.color) setColor(board.brand.color)
  }, [board.brand?.color])
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">Brand:</span>
      {board.brand?.logo_url ? (
        <span className="inline-flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={board.brand.logo_url} alt="logo" className="h-7 max-w-24 rounded border border-border bg-inset object-contain p-0.5" />
          <button
            onClick={() => onLogo(null, true)}
            disabled={logoPending}
            className="text-xs text-ink3 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
            title="Remove logo"
          >
            {logoPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </button>
        </span>
      ) : (
        <button
          onClick={() => logoRef.current?.click()}
          disabled={logoPending}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
        >
          {logoPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {logoPending ? 'Uploading…' : '+ Logo watermark'}
        </button>
      )}
      <input
        ref={logoRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onLogo(f)
          e.target.value = ''
        }}
      />
      <span className="inline-flex items-center gap-1.5">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={colorPending}
          className="h-7 w-9 cursor-pointer rounded border border-border bg-card disabled:cursor-not-allowed disabled:opacity-60"
          title="Brand colour (overrides the accent when readable)"
        />
        {color.toLowerCase() !== (board.brand?.color ?? '').toLowerCase() && (
          <button
            onClick={() => onColor(color)}
            disabled={colorPending}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
          >
            {colorPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Apply
          </button>
        )}
        {board.brand?.color && !board.brand?.color_applied && (
          <span className="text-xs text-warn" title="The brand colour fails the 4.5:1 contrast check against this scheme's paper/ink, so the scheme accent is used instead.">
            low contrast — ignored
          </span>
        )}
      </span>
    </div>
  )
}

