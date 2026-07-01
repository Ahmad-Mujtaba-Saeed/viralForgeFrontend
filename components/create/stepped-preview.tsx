"use client"

import React from "react"
import { CaptionPreview, type CaptionKind } from "./caption-styles"

interface SteppedPreviewProps {
  aspectRatio?: string
  title?: string
  captionText?: string
  captionKind?: CaptionKind
  status?: string
  progress?: number
  isUploading?: boolean
  outputVideoUrl?: string | null
  lengthLabel?: string
  scenesLabel?: string
}

function frameSize(aspect?: string): { w: number; h: number } {
  switch (aspect) {
    case "16:9":
      return { w: 380, h: 214 }
    case "1:1":
      return { w: 300, h: 300 }
    case "9:16":
    default:
      return { w: 236, h: 420 }
  }
}

export function SteppedPreview({
  aspectRatio = "9:16",
  title,
  captionText,
  captionKind = "bold",
  status,
  progress = 0,
  isUploading = false,
  outputVideoUrl = null,
  lengthLabel = "~45s",
  scenesLabel = "—",
}: SteppedPreviewProps) {
  const { w, h } = frameSize(aspectRatio)
  const isComplete = status === "completed" || progress >= 100
  const isProcessing = (status === "processing" || isUploading) && !isComplete
  const pct = Math.min(Math.max(progress, 0), 100)
  const ringDash = `${Math.round((pct / 100) * 201)} 201`

  const stateLabel = isComplete ? "Done" : isProcessing ? (isUploading ? "Uploading" : "Rendering") : "Preview"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink3">Live preview</span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {stateLabel}
        </span>
      </div>

      <div className="flex items-center justify-center py-2">
        <div
          className="relative rounded-[26px] bg-[#0E0D0C] p-[7px] shadow-soft-lg"
          style={{ width: w + 14, height: h + 14 }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-[linear-gradient(165deg,#241C2E,#13131A_60%,#0D0D12)]">
            {isComplete && outputVideoUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={outputVideoUrl} controls autoPlay className="h-full w-full object-contain bg-black" />
            ) : (
              <>
                <div className="absolute inset-0 bg-[repeating-linear-gradient(125deg,rgba(255,255,255,.035),rgba(255,255,255,.035)_9px,transparent_9px,transparent_20px)]" />

                {/* title chip */}
                {title ? (
                  <div className="absolute left-4 top-4 max-w-[70%] truncate rounded-md bg-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    {title}
                  </div>
                ) : null}
                <div className="absolute right-4 top-[18px] font-mono text-[9px] text-white/50">b-roll</div>

                {/* caption */}
                <div className="absolute inset-x-[18px] bottom-[27%] text-center">
                  <CaptionPreview text={captionText || title || "Your caption preview"} kind={captionKind} />
                </div>

                {/* scrubber */}
                <div className="absolute inset-x-4 bottom-5">
                  <div className="h-[3px] rounded-full bg-white/25">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: isProcessing ? `${pct}%` : "38%" }}
                    />
                  </div>
                </div>

                {/* processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative h-[74px] w-[74px]">
                      <svg width="74" height="74" viewBox="0 0 74 74" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="37" cy="37" r="32" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="5" />
                        <circle
                          cx="37"
                          cy="37"
                          r="32"
                          fill="none"
                          stroke="var(--primary)"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={ringDash}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[17px] font-bold text-white">
                        {pct}%
                      </div>
                    </div>
                    <div className="text-[12px] font-medium text-white/80">
                      {isUploading ? "Uploading source…" : pct >= 100 ? "Render complete" : "Rendering your video…"}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { k: "Aspect", v: aspectRatio },
          { k: "Length", v: lengthLabel },
          { k: "Scenes", v: scenesLabel },
        ].map((s) => (
          <div key={s.k} className="flex-1 rounded-xl border border-border bg-card py-3 text-center">
            <div className="text-[11px] font-semibold text-ink3">{s.k}</div>
            <div className="mt-0.5 text-[14px] font-bold text-foreground">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
