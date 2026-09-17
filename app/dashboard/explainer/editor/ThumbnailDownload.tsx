'use client'

import * as React from 'react'
import { Download, ImageIcon, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Storyboard } from './types'
import { useExportDownload } from './useExportDownload'

/**
 * The rendered thumbnail, shown and downloadable. The download goes through
 * useExportDownload — a plain `<a download>` to the API host only opened the
 * picture in a tab.
 */

export type ThumbnailOrientation = 'default' | 'landscape' | 'portrait'

type Entry = { orientation: ThumbnailOrientation; url: string; label: string }

/** Designed thumbs in both orientations when they exist, else the one frame grab. */
export function thumbnailEntries(board: Storyboard): Entry[] {
  const designed = (board.thumbnails ?? []).filter((t) => t.url)
  if (designed.length) {
    return designed.map((t) => ({
      orientation: t.orientation,
      url: t.url,
      label: t.orientation === 'portrait' ? 'Portrait · 9:16' : 'Landscape · 16:9',
    }))
  }
  return board.thumbnail_url ? [{ orientation: 'default', url: board.thumbnail_url, label: 'Thumbnail' }] : []
}

/** The `variant` the download endpoint takes: '' is thumbnail_path itself. */
export const thumbnailVariant = (o: ThumbnailOrientation): string => (o === 'default' ? '' : o)

/** A "Thumbnail" button that opens the pictures with a download under each. */
export function ThumbnailDownload({
  board,
  triggerClassName,
  side = 'top',
  align = 'start',
}: {
  board: Storyboard
  triggerClassName?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}) {
  const entries = thumbnailEntries(board)
  const { download, busy, isBusy, error } = useExportDownload(board.id)
  if (!entries.length) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            triggerClassName ??
            'inline-flex items-center gap-1 font-semibold text-white/75 hover:text-white'
          }
        >
          <ImageIcon className="h-3 w-3" /> Thumbnail
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-[min(92vw,420px)] p-3">
        <p className="text-sm font-semibold text-foreground">Thumbnail</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Made with this render. Ready to upload with the video.</p>
        <div className={`mt-2.5 grid gap-3 ${entries.length > 1 ? 'grid-cols-[1fr_auto]' : 'grid-cols-1'}`}>
          {entries.map((entry) => (
            <div key={entry.orientation} className="flex min-w-0 flex-col">
              <div
                className={`overflow-hidden rounded-lg border border-border bg-inset ${
                  entry.orientation === 'portrait' ? 'aspect-[9/16] h-[158px]' : 'aspect-video w-full'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.url} alt={`${entry.label} thumbnail`} className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => void download('thumbnail', thumbnailVariant(entry.orientation))}
                disabled={busy !== null}
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
              >
                {isBusy('thumbnail', thumbnailVariant(entry.orientation)) ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {entries.length > 1 ? (entry.orientation === 'portrait' ? '9:16' : '16:9') : 'Download'}
              </button>
            </div>
          ))}
        </div>
        {error && <p className="mt-2 text-[11px] text-warn">{error}</p>}
      </PopoverContent>
    </Popover>
  )
}
