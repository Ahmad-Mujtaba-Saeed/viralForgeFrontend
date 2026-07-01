import React from "react"

export type CaptionKind = "karaoke" | "block" | "clean" | "bold"

/** Resolve a backend caption_template id (e.g. "modern_karaoke") to a visual kind + label. */
export function captionStyleFor(id: string): { kind: CaptionKind; label: string } {
  const v = (id || "").toLowerCase()
  let kind: CaptionKind = "bold"
  if (v.includes("karaoke")) kind = "karaoke"
  else if (v.includes("block") || v.includes("pop")) kind = "block"
  else if (v.includes("clean") || v.includes("minimal")) kind = "clean"
  const label = (id || "Caption")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return { kind, label }
}

// Highlight colors chosen to mirror the backend ASS templates:
//  - karaoke  → yellow  (modern_karaoke highlight &H0000FFFF&)
//  - clean    → orange-red (minimal_clean highlight &H000060FF&)
//  - block    → yellow word inside a solid dark box (classic_block, BorderStyle 3)
const HL_KARAOKE = "#FFD400"
const HL_CLEAN = "#FF6A00"

/** Small sample chip shown inside the caption picker. */
export function CaptionSample({ kind }: { kind: CaptionKind }) {
  switch (kind) {
    case "block":
      return (
        <span className="rounded-[5px] bg-black/80 px-1.5 py-0.5 text-[14px] font-extrabold text-white">
          STO<span style={{ color: HL_KARAOKE }}>RY</span>
        </span>
      )
    case "karaoke":
      return (
        <span className="text-[15px] font-bold text-foreground">
          STO<span style={{ color: HL_KARAOKE }}>RY</span>
        </span>
      )
    case "clean":
      return (
        <span className="text-[14px] font-semibold tracking-wide text-foreground">
          Sto<span style={{ color: HL_CLEAN }}>ry</span>
        </span>
      )
    case "bold":
    default:
      return (
        <span className="text-[16px] font-extrabold tracking-tight text-foreground">STORY</span>
      )
  }
}

/** Live caption as it would appear over the video, using the selected style. */
export function CaptionPreview({ text, kind }: { text: string; kind: CaptionKind }) {
  const words = (text || "Your caption here").trim().split(/\s+/).slice(0, 6)
  // Highlight roughly the middle word, like the mockup.
  const hi = Math.min(words.length - 1, Math.max(1, Math.floor(words.length / 2)))

  if (kind === "block") {
    // Solid dark box behind the whole line, current word highlighted yellow.
    return (
      <div className="inline-block rounded-md bg-black/80 px-2.5 py-1 text-[20px] font-extrabold leading-[1.5] text-white">
        {words.map((w, i) => (
          <span key={i} style={i === hi ? { color: HL_KARAOKE } : undefined}>
            {w}{" "}
          </span>
        ))}
      </div>
    )
  }

  if (kind === "karaoke") {
    // White line, current word highlighted yellow (modern_karaoke).
    return (
      <div
        className="text-[21px] font-bold leading-[1.2] text-white"
        style={{ textShadow: "0 2px 10px rgba(0,0,0,.7)" }}
      >
        {words.map((w, i) => (
          <span key={i} style={i === hi ? { color: HL_KARAOKE } : undefined}>
            {w}{" "}
          </span>
        ))}
      </div>
    )
  }

  if (kind === "clean") {
    // White line, current word highlighted orange-red (minimal_clean).
    return (
      <div
        className="text-[18px] font-semibold leading-[1.35] tracking-wide text-white"
        style={{ textShadow: "0 2px 10px rgba(0,0,0,.7)" }}
      >
        {words.map((w, i) => (
          <span key={i} style={i === hi ? { color: HL_CLEAN } : undefined}>
            {w}{" "}
          </span>
        ))}
      </div>
    )
  }

  // bold (default)
  return (
    <div
      className="text-[21px] font-extrabold leading-[1.15] tracking-tight text-white"
      style={{ textShadow: "0 2px 14px rgba(0,0,0,.6)" }}
    >
      {words.map((w, i) => (
        <span key={i} className={i === hi ? "text-primary" : ""}>
          {w}{" "}
        </span>
      ))}
    </div>
  )
}
