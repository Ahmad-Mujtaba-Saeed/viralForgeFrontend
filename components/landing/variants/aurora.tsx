"use client"

import * as React from "react"
import Link from "next/link"
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  type MotionValue,
} from "framer-motion"
import {
  ArrowRight,
  Check,
  Menu,
  X,
  Zap,
  Sparkles,
  Play,
  Twitter,
  Instagram,
  Youtube,
  Wand2,
  ChevronDown,
} from "lucide-react"
import {
  TEMPLATES,
  FEATURES,
  STEPS,
  TESTIMONIALS,
  TIERS,
  NAV_LINKS,
  STATS,
  LINKS,
  yearlyPrice,
  TEMPLATE_ICONS_BY_SLUG,
  type Tier,
  type Template,
} from "@/components/landing/shared/content"
import { TemplateArt, artKindFor } from "@/components/dashboard/template-art"
import { useLandingAuth } from "@/components/landing/shared/useLandingAuth"

/* ------------------------------------------------------------------ *
 * Aurora Glass — self-contained dark palette.
 *
 * Like the other landing variants, this one hardcodes its colours rather
 * than reading app theme tokens, so an admin can serve it regardless of
 * which skin the app is wearing. It always renders its aurora night look.
 * ------------------------------------------------------------------ */
const C = {
  bg: "#08071A",
  ink: "#EAE8FF",
  ink2: "#A9A3D9",
  ink3: "#7B76A8",
  violet: "#7C5CFF",
  cyan: "#22D3EE",
  pink: "#FF5CA8",
  glass: "rgba(255,255,255,0.06)",
  glassStrong: "rgba(255,255,255,0.10)",
  line: "rgba(255,255,255,0.12)",
  lineSoft: "rgba(255,255,255,0.07)",
}

const glassCard =
  "rounded-3xl border backdrop-blur-2xl backdrop-saturate-150 [background:rgba(255,255,255,0.05)] [border-color:rgba(255,255,255,0.10)]"

const rise = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}

const iconFor = (slug: string) => TEMPLATE_ICONS_BY_SLUG[slug] ?? Wand2

/* ============================ Backdrop ============================= */
/* The drifting aurora the glass refracts. Two CSS-animated pools plus a
   third that parallaxes with scroll, so the field feels like it has depth
   rather than sitting flat behind the page. */
function AuroraBackdrop({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "35%"])
  const orbY = useSpring(y, { stiffness: 40, damping: 20 })

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: C.bg }}
      aria-hidden="true"
    >
      <div className="aurora-pool aurora-pool-a" />
      <div className="aurora-pool aurora-pool-b" />
      <motion.div className="aurora-pool aurora-pool-c" style={{ y: orbY }} />

      {/* Grain: kills banding across these very large soft gradients. */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <style jsx>{`
        .aurora-pool {
          position: absolute;
          border-radius: 9999px;
          filter: blur(100px);
          will-change: transform;
        }
        .aurora-pool-a {
          width: 62vw;
          height: 62vw;
          top: -20vw;
          left: -12vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(124, 92, 255, 0.55),
            transparent 68%
          );
          animation: pool-a 24s ease-in-out infinite alternate;
        }
        .aurora-pool-b {
          width: 55vw;
          height: 55vw;
          bottom: -22vw;
          right: -14vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(34, 211, 238, 0.38),
            transparent 68%
          );
          animation: pool-b 30s ease-in-out infinite alternate;
        }
        .aurora-pool-c {
          width: 48vw;
          height: 48vw;
          top: 30%;
          left: 42%;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(255, 92, 168, 0.32),
            transparent 68%
          );
          animation: pool-c 26s ease-in-out infinite alternate;
        }
        @keyframes pool-a {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to   { transform: translate3d(8vw, 6vh, 0) scale(1.18); }
        }
        @keyframes pool-b {
          from { transform: translate3d(0, 0, 0) scale(1.12); }
          to   { transform: translate3d(-9vw, -5vh, 0) scale(1); }
        }
        @keyframes pool-c {
          from { transform: translate3d(-5vw, 0, 0) scale(0.95); }
          to   { transform: translate3d(6vw, -6vh, 0) scale(1.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-pool { animation: none; }
        }
      `}</style>
    </div>
  )
}

/* ========================= Spotlight card ========================== */
/* Tracks the cursor and lights the glass where the pointer is — the
   single cheapest trick that makes a flat translucent panel read as a
   physical, lit surface. */
function Spotlight({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const mx = useMotionValue(-999)
  const my = useMotionValue(-999)

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set(e.clientX - rect.left)
    my.set(e.clientY - rect.top)
  }

  const reset = () => {
    mx.set(-999)
    my.set(-999)
  }

  const background = useTransform(
    [mx, my] as const,
    ([x, y]: number[]) =>
      `radial-gradient(340px circle at ${x}px ${y}px, rgba(124,92,255,0.18), transparent 70%)`
  )

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`group relative overflow-hidden ${glassCard} ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      {/* Specular top edge. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

/* ============================= Navbar ============================== */
function Navbar({ scrollY }: { scrollY: MotionValue<number> }) {
  const [open, setOpen] = React.useState(false)
  const [solid, setSolid] = React.useState(false)
  const { ready, isAuthenticated, initials } = useLandingAuth()

  React.useEffect(
    () => scrollY.on("change", (v) => setSolid(v > 24)),
    [scrollY]
  )

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className="transition-all duration-300"
        style={{
          background: solid ? "rgba(8,7,26,0.72)" : "transparent",
          backdropFilter: solid ? "blur(20px) saturate(160%)" : "none",
          WebkitBackdropFilter: solid ? "blur(20px) saturate(160%)" : "none",
          borderBottom: `1px solid ${solid ? C.lineSoft : "transparent"}`,
        }}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
                boxShadow: `0 6px 24px -6px ${C.violet}`,
              }}
            >
              <Sparkles className="h-[18px] w-[18px] text-white" />
            </span>
            <span
              className="font-display text-[19px] font-bold tracking-tight"
              style={{ color: C.ink }}
            >
              ViralForge
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors hover:bg-white/5"
                style={{ color: C.ink2 }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2.5 md:flex">
            {ready && isAuthenticated ? (
              <Link
                href={LINKS.app}
                className="flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-[13.5px] font-semibold backdrop-blur-xl transition-colors hover:bg-white/10"
                style={{
                  color: C.ink,
                  borderColor: C.line,
                  background: C.glass,
                }}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${C.violet}, ${C.pink})`,
                  }}
                >
                  {initials || "U"}
                </span>
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href={LINKS.signIn}
                  className="rounded-xl px-3.5 py-2 text-[13.5px] font-semibold transition-colors hover:bg-white/5"
                  style={{ color: C.ink2 }}
                >
                  Sign in
                </Link>
                <Link
                  href={LINKS.start}
                  className="rounded-xl px-4 py-2 text-[13.5px] font-bold text-white transition-transform hover:scale-[1.03]"
                  style={{
                    background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
                    boxShadow: `0 8px 30px -8px ${C.violet}`,
                  }}
                >
                  Start free
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 md:hidden"
            style={{ color: C.ink }}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-2 rounded-2xl border p-4 backdrop-blur-2xl md:hidden"
          style={{ background: "rgba(8,7,26,0.9)", borderColor: C.line }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium"
              style={{ color: C.ink2 }}
            >
              {l.label}
            </a>
          ))}
          <Link
            href={ready && isAuthenticated ? LINKS.app : LINKS.start}
            className="mt-2 block rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})` }}
          >
            {ready && isAuthenticated ? "Open dashboard" : "Start free"}
          </Link>
        </motion.div>
      )}
    </header>
  )
}

/* ============================== Hero =============================== */
function Hero({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const { ready, isAuthenticated, firstName } = useLandingAuth()

  // The hero mock recedes as you scroll — tilts back, shrinks and fades,
  // so the page feels like it's diving *through* the glass into the content.
  const mockY = useTransform(scrollYProgress, [0, 0.18], [0, -60])
  const mockScale = useTransform(scrollYProgress, [0, 0.18], [1, 0.92])
  const mockRotate = useTransform(scrollYProgress, [0, 0.18], [0, -6])
  const mockOpacity = useTransform(scrollYProgress, [0, 0.16], [1, 0.35])
  const copyY = useTransform(scrollYProgress, [0, 0.18], [0, -30])

  const smoothY = useSpring(mockY, { stiffness: 60, damping: 20 })

  return (
    <section className="relative px-4 pb-24 pt-36 sm:px-6 lg:px-8">
      <motion.div
        style={{ y: copyY }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold backdrop-blur-xl"
          style={{ borderColor: C.line, background: C.glass, color: C.ink2 }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }}
          />
          {ready && isAuthenticated && firstName
            ? `Welcome back, ${firstName}`
            : "AI video, start to finish"}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.06 }}
          className="font-display mt-6 text-[42px] font-extrabold leading-[1.05] tracking-tight sm:text-[62px]"
          style={{ color: C.ink, letterSpacing: "-0.03em" }}
        >
          Turn a script into
          <br />
          <span
            style={{
              background: `linear-gradient(110deg, ${C.violet}, ${C.cyan} 45%, ${C.pink})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            a video that travels.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.14 }}
          className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed"
          style={{ color: C.ink2 }}
        >
          Scripting, voiceover, captions, music and the edit — generated,
          synced and rendered for you. Post-ready in minutes, not weekends.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href={ready && isAuthenticated ? LINKS.app : LINKS.start}
            className="group inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-[14.5px] font-bold text-white transition-transform hover:scale-[1.03]"
            style={{
              background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
              boxShadow: `0 14px 44px -10px ${C.violet}`,
            }}
          >
            {ready && isAuthenticated ? "Open dashboard" : "Start creating free"}
            <ArrowRight className="h-[17px] w-[17px] transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#templates"
            className="inline-flex h-12 items-center gap-2 rounded-2xl border px-6 text-[14.5px] font-semibold backdrop-blur-xl transition-colors hover:bg-white/10"
            style={{ color: C.ink, borderColor: C.line, background: C.glass }}
          >
            <Play className="h-4 w-4 fill-current" />
            See what it makes
          </a>
        </motion.div>
      </motion.div>

      {/* Floating glass app mock */}
      <motion.div
        style={{
          y: smoothY,
          scale: mockScale,
          rotateX: mockRotate,
          opacity: mockOpacity,
          transformPerspective: 1400,
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.3 }}
        className="mx-auto mt-20 max-w-4xl"
      >
        <AppMock />
      </motion.div>

      <motion.a
        href="#templates"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mx-auto mt-14 flex w-fit flex-col items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: C.ink3 }}
      >
        Scroll
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.a>
    </section>
  )
}

/* A glass rendition of the actual create screen. */
function AppMock() {
  return (
    <div
      className="overflow-hidden rounded-[26px] border backdrop-blur-2xl"
      style={{
        borderColor: C.line,
        background: "rgba(255,255,255,0.055)",
        boxShadow: `0 50px 120px -30px rgba(0,0,0,0.8), 0 0 90px -50px ${C.violet}`,
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: C.lineSoft }}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span
          className="ml-3 rounded-md px-2.5 py-1 text-[11px] font-medium"
          style={{ background: "rgba(255,255,255,0.05)", color: C.ink3 }}
        >
          viralforge.app / create
        </span>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-[1.25fr_1fr]">
        <div>
          <div
            className="text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.ink3 }}
          >
            Template
          </div>
          <div className="mt-2.5 space-y-2">
            {TEMPLATES.slice(0, 3).map((t, i) => {
              const Icon = iconFor(t.icon)
              const active = i === 0
              return (
                <div
                  key={t.key}
                  className="flex items-center gap-3 rounded-2xl border p-3 backdrop-blur-xl"
                  style={{
                    borderColor: active ? "rgba(124,92,255,0.5)" : C.lineSoft,
                    background: active
                      ? "rgba(124,92,255,0.12)"
                      : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${C.violet}, ${C.cyan})`
                        : "rgba(255,255,255,0.06)",
                      color: active ? "#fff" : C.ink2,
                    }}
                  >
                    <Icon className="h-[17px] w-[17px]" />
                  </span>
                  <div className="min-w-0">
                    <div
                      className="truncate text-[13px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {t.name}
                    </div>
                    <div className="truncate text-[11.5px]" style={{ color: C.ink3 }}>
                      {t.tagline}
                    </div>
                  </div>
                  {active && (
                    <Check
                      className="ml-auto h-4 w-4 flex-shrink-0"
                      style={{ color: C.violet }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div
            className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3"
            style={{
              background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
              boxShadow: `0 12px 36px -12px ${C.violet}`,
            }}
          >
            <span className="text-[13px] font-bold text-white">Generate video</span>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/85">
              <Zap className="h-3.5 w-3.5 fill-current" /> 6 credits
            </span>
          </div>
        </div>

        {/* Phone preview with a shimmering render bar */}
        <div className="flex items-center justify-center">
          <div
            className="relative w-[132px] overflow-hidden rounded-[20px] border"
            style={{
              aspectRatio: "9 / 16",
              borderColor: C.line,
              background: "linear-gradient(165deg, #1B1440, #0B0A1E)",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-24 opacity-60"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${C.violet}, transparent 70%)`,
              }}
            />
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center">
              <p className="text-[15px] font-extrabold leading-tight text-white">
                This <span style={{ color: C.cyan }}>changed</span> everything
              </p>
            </div>
            <div className="absolute inset-x-3 bottom-3">
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${C.violet}, ${C.cyan})`,
                  }}
                  animate={{ width: ["12%", "88%", "12%"] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                />
              </div>
              <div className="mt-1.5 text-[9.5px] font-semibold" style={{ color: C.ink3 }}>
                Rendering · 9:16
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================== Stats ============================== */
function StatsStrip() {
  return (
    <section className="px-4 pb-8 sm:px-6 lg:px-8">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className={`mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden lg:grid-cols-4 ${glassCard}`}
      >
        {STATS.map((s) => (
          <motion.div key={s.label} variants={rise} className="p-6 text-center">
            <div
              className="font-display text-[30px] font-bold tracking-tight"
              style={{
                background: `linear-gradient(110deg, ${C.violet}, ${C.cyan})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {s.value}
            </div>
            <div className="mt-1 text-[12.5px]" style={{ color: C.ink3 }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

/* ========================== Section head =========================== */
function SectionHead({
  eyebrow,
  title,
  accent,
  sub,
}: {
  eyebrow: string
  title: string
  accent?: string
  sub?: string
}) {
  return (
    <motion.div
      variants={rise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="mx-auto max-w-2xl text-center"
    >
      <span
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.12em] backdrop-blur-xl"
        style={{ borderColor: C.line, background: C.glass, color: C.ink2 }}
      >
        {eyebrow}
      </span>
      <h2
        className="font-display mt-5 text-[32px] font-bold leading-[1.1] tracking-tight sm:text-[42px]"
        style={{ color: C.ink, letterSpacing: "-0.02em" }}
      >
        {title}{" "}
        {accent && (
          <span
            style={{
              background: `linear-gradient(110deg, ${C.violet}, ${C.cyan})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {accent}
          </span>
        )}
      </h2>
      {sub && (
        <p className="mt-3.5 text-[15.5px] leading-relaxed" style={{ color: C.ink2 }}>
          {sub}
        </p>
      )}
    </motion.div>
  )
}

/* ============================ Templates ============================ */
/* Bento: the first template gets a double-wide hero cell, the rest tile
   around it — so the grid has a focal point instead of reading as a
   uniform wall of cards. */
function Templates({ templates }: { templates: Template[] }) {
  const [hero, ...rest] = templates

  return (
    <section id="templates" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="What you can make"
          title={`${templates.length} pipelines,`}
          accent="one click."
          sub="Every template is the whole job — script, voiceover, captions, music and the edit. Pick one and go."
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {hero && (
            <motion.div variants={rise} className="sm:col-span-2">
              <Spotlight className="h-full">
                <div className="grid h-full gap-0 sm:grid-cols-[1.05fr_1fr]">
                  <div className="flex flex-col justify-center p-7">
                    <div className="flex items-center gap-2">
                      {hero.badge && (
                        <span
                          className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white"
                          style={{
                            background: `linear-gradient(135deg, ${C.violet}, ${C.pink})`,
                          }}
                        >
                          {hero.badge}
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-bold"
                        style={{ background: "rgba(255,255,255,0.07)", color: C.ink2 }}
                      >
                        <Zap className="h-3 w-3" style={{ color: C.cyan }} />
                        {hero.credits}
                      </span>
                    </div>
                    <h3
                      className="font-display mt-4 text-[26px] font-bold leading-tight tracking-tight"
                      style={{ color: C.ink }}
                    >
                      {hero.name}
                    </h3>
                    <p
                      className="mt-2 text-[14px] leading-relaxed"
                      style={{ color: C.ink2 }}
                    >
                      {hero.description}
                    </p>
                    <Link
                      href={LINKS.start}
                      className="mt-5 inline-flex w-fit items-center gap-1.5 text-[13.5px] font-bold"
                      style={{ color: C.violet }}
                    >
                      Use this template
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div
                    className="relative min-h-[220px] overflow-hidden"
                    style={{ background: "rgba(124,92,255,0.10)" }}
                  >
                    <TemplateArt kind={artKindFor(hero.key)} accent={C.violet} />
                  </div>
                </div>
              </Spotlight>
            </motion.div>
          )}

          {rest.map((t) => {
            const Icon = iconFor(t.icon)
            return (
              <motion.div key={t.key} variants={rise}>
                <Spotlight className="h-full p-6">
                  <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          border: `1px solid ${C.lineSoft}`,
                          color: C.cyan,
                        }}
                      >
                        <Icon className="h-[21px] w-[21px]" />
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-bold"
                        style={{ background: "rgba(255,255,255,0.07)", color: C.ink2 }}
                      >
                        <Zap className="h-3 w-3" style={{ color: C.cyan }} />
                        {t.credits}
                      </span>
                    </div>
                    <div
                      className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: C.ink3 }}
                    >
                      {t.tagline}
                    </div>
                    <h3
                      className="font-display mt-1.5 text-[18px] font-bold tracking-tight"
                      style={{ color: C.ink }}
                    >
                      {t.name}
                    </h3>
                    <p
                      className="mt-2 text-[13px] leading-relaxed"
                      style={{ color: C.ink2 }}
                    >
                      {t.description}
                    </p>
                  </div>
                </Spotlight>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* ========================== How it works =========================== */
/* Sticky visual on the left, steps scroll past on the right, and the
   active step lights up as it enters view. */
function HowItWorks() {
  return (
    <section id="how" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="How it works"
          title="Three steps."
          accent="No timeline."
          sub="You bring the idea. Everything downstream of it is automated."
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <Spotlight className="p-8">
                <div
                  className="font-display text-[13px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.ink3 }}
                >
                  The whole pipeline
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    "Script written",
                    "Voiceover synthesised",
                    "Captions timed to the word",
                    "Music matched to mood",
                    "B-roll & visuals generated",
                    "Cut, rendered, exported",
                  ].map((line, i) => (
                    <motion.div
                      key={line}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: "rgba(52,226,176,0.14)",
                          color: "#34E2B0",
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[14px]" style={{ color: C.ink2 }}>
                        {line}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div
                  className="mt-7 rounded-2xl p-4"
                  style={{
                    background: `linear-gradient(135deg, rgba(124,92,255,0.18), rgba(34,211,238,0.12))`,
                    border: `1px solid ${C.line}`,
                  }}
                >
                  <div className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                    Average time to a post-ready short
                  </div>
                  <div
                    className="font-display mt-1 text-[28px] font-bold"
                    style={{ color: C.cyan }}
                  >
                    ~4 minutes
                  </div>
                </div>
              </Spotlight>
            </div>
          </div>

          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <Spotlight className="p-7">
                  <div className="flex items-start gap-5">
                    <span
                      className="font-display flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-[20px] font-bold"
                      style={{
                        background:
                          i === 0
                            ? `linear-gradient(135deg, ${C.violet}, ${C.cyan})`
                            : "rgba(255,255,255,0.06)",
                        color: i === 0 ? "#fff" : C.ink2,
                        border: `1px solid ${C.lineSoft}`,
                      }}
                    >
                      {s.n}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <s.icon className="h-4 w-4" style={{ color: C.cyan }} />
                        <h3
                          className="font-display text-[19px] font-bold tracking-tight"
                          style={{ color: C.ink }}
                        >
                          {s.title}
                        </h3>
                      </div>
                      <p
                        className="mt-2 text-[14px] leading-relaxed"
                        style={{ color: C.ink2 }}
                      >
                        {s.description}
                      </p>
                    </div>
                  </div>
                </Spotlight>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================ Features ============================= */
function Features() {
  return (
    <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="Everything included"
          title="No add-ons."
          accent="No per-word fees."
          sub="The things other tools charge extra for are simply part of the render here."
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={rise}>
              <Spotlight className="h-full p-6">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, rgba(124,92,255,0.25), rgba(34,211,238,0.18))`,
                    border: `1px solid ${C.lineSoft}`,
                    color: C.ink,
                  }}
                >
                  <f.icon className="h-[20px] w-[20px]" />
                </span>
                <h3
                  className="font-display mt-5 text-[17px] font-bold tracking-tight"
                  style={{ color: C.ink }}
                >
                  {f.title}
                </h3>
                <p
                  className="mt-2 text-[13.5px] leading-relaxed"
                  style={{ color: C.ink2 }}
                >
                  {f.description}
                </p>
              </Spotlight>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ========================== Testimonials =========================== */
/* Infinite marquee — motion that rewards scrolling without demanding it. */
function Testimonials() {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS]

  return (
    <section className="overflow-hidden py-24">
      <div className="px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow="Creators"
          title="Built for people who"
          accent="post daily."
        />
      </div>

      <div className="relative mt-14">
        {/* Edge fades so the marquee dissolves rather than hard-cuts. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
          style={{ background: `linear-gradient(90deg, ${C.bg}, transparent)` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
          style={{ background: `linear-gradient(270deg, ${C.bg}, transparent)` }}
        />

        <div className="marquee flex gap-5">
          {loop.map((t, i) => (
            <figure
              key={`${t.name}-${i}`}
              className={`w-[340px] flex-shrink-0 p-6 ${glassCard}`}
            >
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: C.ink }}
              >
                “{t.quote}”
              </p>
              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${C.violet}, ${C.pink})`,
                  }}
                >
                  {t.avatar}
                </span>
                <span>
                  <span
                    className="block text-[13.5px] font-bold"
                    style={{ color: C.ink }}
                  >
                    {t.name}
                  </span>
                  <span className="block text-[12px]" style={{ color: C.ink3 }}>
                    {t.role}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee {
          width: max-content;
          animation: scroll-x 42s linear infinite;
        }
        .marquee:hover {
          animation-play-state: paused;
        }
        @keyframes scroll-x {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee { animation: none; }
        }
      `}</style>
    </section>
  )
}

/* ============================= Pricing ============================= */
function Pricing() {
  const [interval, setInterval] = React.useState<"month" | "year">("month")
  const price = (t: Tier) => (interval === "year" ? yearlyPrice(t.monthly) : t.monthly)

  return (
    <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="Pricing"
          title="Credits that"
          accent="refill daily."
          sub="No rollover games, no surprise overages. Wake up, make something."
        />

        <div className="mt-9 flex justify-center">
          <div
            className="inline-flex rounded-2xl border p-1 backdrop-blur-xl"
            style={{ borderColor: C.line, background: C.glass }}
          >
            {(["month", "year"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setInterval(opt)}
                className="cursor-pointer rounded-xl px-5 py-2 text-[13.5px] font-bold transition-all"
                style={
                  interval === opt
                    ? {
                        background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
                        color: "#fff",
                      }
                    : { color: C.ink3, background: "transparent" }
                }
              >
                {opt === "month" ? "Monthly" : "Yearly"}
                {opt === "year" && (
                  <span className="ml-1.5 text-[11px] opacity-90">−25%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-12 grid gap-5 lg:grid-cols-3"
        >
          {TIERS.map((t) => {
            const popular = t.popular
            return (
              <motion.div key={t.name} variants={rise} className="relative">
                {popular && (
                  <div
                    className="pointer-events-none absolute -inset-px rounded-3xl opacity-60 blur-lg"
                    style={{
                      background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
                    }}
                  />
                )}
                <div
                  className={`relative h-full p-7 ${glassCard}`}
                  style={
                    popular
                      ? {
                          background: "rgba(255,255,255,0.09)",
                          borderColor: "rgba(124,92,255,0.5)",
                        }
                      : undefined
                  }
                >
                  {popular && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white"
                      style={{
                        background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
                      }}
                    >
                      Most popular
                    </span>
                  )}

                  <h3
                    className="text-[13px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.ink3 }}
                  >
                    {t.name}
                  </h3>

                  <div className="mt-4 flex items-end gap-1.5">
                    <span
                      className="font-display text-[42px] font-bold leading-none tracking-tight"
                      style={{ color: C.ink }}
                    >
                      ${price(t)}
                    </span>
                    <span className="pb-1.5 text-[13px]" style={{ color: C.ink3 }}>
                      /{interval === "year" ? "yr" : "mo"}
                    </span>
                  </div>

                  <div
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-bold"
                    style={{ background: "rgba(34,211,238,0.12)", color: C.cyan }}
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    {t.dailyCredits} credits / day
                  </div>

                  <p className="mt-4 text-[13.5px]" style={{ color: C.ink2 }}>
                    {t.description}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          className="mt-0.5 h-4 w-4 flex-shrink-0"
                          style={{ color: C.cyan }}
                        />
                        <span className="text-[13.5px]" style={{ color: C.ink2 }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={LINKS.start}
                    className="mt-7 flex h-11 items-center justify-center rounded-2xl text-[14px] font-bold transition-transform hover:scale-[1.02]"
                    style={
                      popular
                        ? {
                            background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
                            color: "#fff",
                            boxShadow: `0 12px 36px -12px ${C.violet}`,
                          }
                        : {
                            background: "rgba(255,255,255,0.07)",
                            color: C.ink,
                            border: `1px solid ${C.line}`,
                          }
                    }
                  >
                    Get {t.name}
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* ============================== CTA ================================ */
function FinalCTA() {
  const { ready, isAuthenticated } = useLandingAuth()

  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <motion.div
        variants={rise}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className={`relative mx-auto max-w-4xl overflow-hidden p-12 text-center sm:p-16 ${glassCard}`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(600px circle at 50% 0%, rgba(124,92,255,0.28), transparent 70%)`,
          }}
        />
        <div className="relative">
          <h2
            className="font-display text-[34px] font-bold leading-tight tracking-tight sm:text-[46px]"
            style={{ color: C.ink, letterSpacing: "-0.02em" }}
          >
            Your next video is{" "}
            <span
              style={{
                background: `linear-gradient(110deg, ${C.violet}, ${C.cyan}, ${C.pink})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              four minutes away.
            </span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-md text-[15.5px] leading-relaxed"
            style={{ color: C.ink2 }}
          >
            Free credits the moment you sign up. No card, no call, no catch.
          </p>
          <Link
            href={ready && isAuthenticated ? LINKS.app : LINKS.start}
            className="group mt-8 inline-flex h-12 items-center gap-2 rounded-2xl px-7 text-[14.5px] font-bold text-white transition-transform hover:scale-[1.03]"
            style={{
              background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
              boxShadow: `0 16px 50px -12px ${C.violet}`,
            }}
          >
            {ready && isAuthenticated ? "Open dashboard" : "Start creating free"}
            <ArrowRight className="h-[17px] w-[17px] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

/* ============================= Footer ============================== */
function Footer() {
  return (
    <footer
      className="border-t px-4 py-12 sm:px-6 lg:px-8"
      style={{ borderColor: C.lineSoft }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})` }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span
            className="font-display text-[16px] font-bold tracking-tight"
            style={{ color: C.ink }}
          >
            ViralForge
          </span>
        </Link>

        <p className="text-[13px]" style={{ color: C.ink3 }}>
          © {new Date().getFullYear()} ViralForge. All rights reserved.
        </p>

        <div className="flex items-center gap-2">
          {[Twitter, Instagram, Youtube].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-white/10"
              style={{ borderColor: C.lineSoft, color: C.ink2 }}
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

/* ============================== Page =============================== */
export default function LandingAurora({
  templates = TEMPLATES,
}: {
  templates?: Template[]
}) {
  const { scrollY, scrollYProgress } = useScroll()

  // Top scroll-progress bar — a small, honest wayfinding cue on a long page.
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <main
      className="relative min-h-screen font-sans antialiased"
      style={{ background: C.bg, color: C.ink }}
    >
      <AuroraBackdrop scrollYProgress={scrollYProgress} />

      <motion.div
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left"
        style={{
          scaleX: progress,
          background: `linear-gradient(90deg, ${C.violet}, ${C.cyan}, ${C.pink})`,
        }}
      />

      <Navbar scrollY={scrollY} />
      <Hero scrollYProgress={scrollYProgress} />
      <StatsStrip />
      <Templates templates={templates} />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  )
}
