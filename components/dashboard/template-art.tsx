import React from "react"

type ArtKind =
  | "story"
  | "quiz"
  | "compare"
  | "listicle"
  | "quote"
  | "news"
  | "reaction"
  | "tutorial"

const PALETTE = [
  { bg: "linear-gradient(160deg,#2A1E3A,#15131C)", a: "#E8492B" },
  { bg: "linear-gradient(160deg,#11324A,#0C1A26)", a: "#3FA9F5" },
  { bg: "linear-gradient(160deg,#3A1320,#1C0C12)", a: "#FF5A38" },
  { bg: "linear-gradient(160deg,#16302A,#0C1A17)", a: "#1F9E6B" },
  { bg: "linear-gradient(160deg,#2E2410,#171206)", a: "#F6A14A" },
  { bg: "linear-gradient(160deg,#1A1430,#0E0B1A)", a: "#8A57D8" },
  { bg: "linear-gradient(160deg,#0F2E33,#08191C)", a: "#19C2C2" },
  { bg: "linear-gradient(160deg,#311A14,#1A0D09)", a: "#E8492B" },
]

/** Pick a deterministic art kind from a template type string. */
export function artKindFor(templateType: string): ArtKind {
  const t = (templateType || "").toLowerCase()
  if (t.includes("horror") || t.includes("story")) return "story"
  if (t.includes("explainer") || t.includes("tutorial")) return "tutorial"
  if (t.includes("image")) return "listicle"
  if (t.includes("gameplay") || t.includes("yt") || t.includes("reaction")) return "reaction"
  if (t.includes("compilation") || t.includes("compare")) return "compare"
  if (t.includes("quiz") || t.includes("trivia")) return "quiz"
  if (t.includes("quote") || t.includes("wisdom")) return "quote"
  return "news"
}

export function paletteFor(seed: number) {
  return PALETTE[seed % PALETTE.length]
}

/** Generative thumbnail art per template, ported from the design mockup. */
export function TemplateArt({ kind, accent }: { kind: ArtKind; accent: string }) {
  const wrap = (children: React.ReactNode) => (
    <svg width="100%" height="100%" viewBox="0 0 160 110" preserveAspectRatio="xMidYMid slice">
      {children}
    </svg>
  )

  switch (kind) {
    case "story":
      return wrap(
        <>
          <circle cx={80} cy={46} r={30} fill="rgba(255,255,255,.10)" />
          <rect x={38} y={84} width={84} height={9} rx={4.5} fill="#fff" opacity={0.9} />
          <rect x={54} y={84} width={30} height={9} rx={4.5} fill={accent} />
        </>
      )
    case "quiz":
      return wrap(
        <>
          <rect x={24} y={24} width={50} height={34} rx={7} fill="rgba(255,255,255,.14)" />
          <rect x={86} y={24} width={50} height={34} rx={7} fill={accent} opacity={0.9} />
          <rect x={24} y={66} width={50} height={20} rx={6} fill="rgba(255,255,255,.10)" />
          <rect x={86} y={66} width={50} height={20} rx={6} fill="rgba(255,255,255,.10)" />
        </>
      )
    case "compare":
      return wrap(
        <>
          <rect x={14} y={18} width={60} height={74} rx={8} fill="rgba(255,255,255,.12)" />
          <rect x={86} y={18} width={60} height={74} rx={8} fill={accent} opacity={0.55} />
          <text x={80} y={60} fill="#fff" fontSize={16} fontWeight={800} textAnchor="middle" fontFamily="sans-serif">
            VS
          </text>
        </>
      )
    case "listicle":
      return wrap(
        <>
          <rect x={26} y={22} width={14} height={14} rx={4} fill={accent} />
          <rect x={48} y={24} width={86} height={9} rx={4.5} fill="rgba(255,255,255,.7)" />
          <rect x={26} y={48} width={14} height={14} rx={4} fill="rgba(255,255,255,.3)" />
          <rect x={48} y={50} width={74} height={9} rx={4.5} fill="rgba(255,255,255,.45)" />
          <rect x={26} y={74} width={14} height={14} rx={4} fill="rgba(255,255,255,.3)" />
          <rect x={48} y={76} width={80} height={9} rx={4.5} fill="rgba(255,255,255,.45)" />
        </>
      )
    case "quote":
      return wrap(
        <>
          <text x={24} y={54} fill={accent} fontSize={54} fontWeight={800} fontFamily="serif">
            &ldquo;
          </text>
          <rect x={54} y={34} width={82} height={9} rx={4.5} fill="rgba(255,255,255,.7)" />
          <rect x={54} y={50} width={64} height={9} rx={4.5} fill="rgba(255,255,255,.5)" />
          <rect x={54} y={72} width={40} height={8} rx={4} fill={accent} opacity={0.8} />
        </>
      )
    case "reaction":
      return wrap(
        <>
          <rect x={14} y={14} width={132} height={62} rx={8} fill="rgba(255,255,255,.12)" />
          <circle cx={34} cy={90} r={13} fill={accent} />
          <rect x={54} y={84} width={80} height={8} rx={4} fill="rgba(255,255,255,.5)" />
        </>
      )
    case "tutorial":
      return wrap(
        <>
          <circle cx={80} cy={45} r={24} fill="rgba(255,255,255,.12)" />
          <polygon points="73,34 73,56 92,45" fill="#fff" />
          <rect x={30} y={82} width={100} height={8} rx={4} fill="rgba(255,255,255,.4)" />
          <rect x={30} y={82} width={46} height={8} rx={4} fill={accent} />
        </>
      )
    case "news":
    default:
      return wrap(
        <>
          <rect x={0} y={0} width={160} height={26} fill={accent} />
          <rect x={14} y={9} width={54} height={8} rx={4} fill="#fff" />
          <rect x={14} y={40} width={132} height={46} rx={8} fill="rgba(255,255,255,.12)" />
          <rect x={14} y={94} width={90} height={7} rx={3.5} fill="rgba(255,255,255,.4)" />
        </>
      )
  }
}
