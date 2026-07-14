"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Check,
  Flame,
  Menu,
  X,
  Star,
  Play,
  Zap,
  Twitter,
  Instagram,
  Youtube,
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
  type Tier,
  type Template,
} from "@/components/landing/shared/content"
import { TemplateArt, artKindFor, paletteFor } from "@/components/dashboard/template-art"
import { useLandingAuth } from "@/components/landing/shared/useLandingAuth"

/* Cinematic dark palette — self-contained dark theme, always renders dark. */
const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#FF5A38]/30 bg-[#FF5A38]/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF8A5C]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A38] shadow-[0_0_10px_#FF5A38]" />
      {children}
    </span>
  )
}

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
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display mt-5 text-[34px] font-extrabold leading-[1.02] tracking-tight text-[#F2F0EB] sm:text-[46px]">
        {title}{" "}
        {accent && (
          <span className="text-[#FF6A45]" style={{ textShadow: "0 0 40px rgba(255,90,56,.5)" }}>
            {accent}
          </span>
        )}
      </h2>
      {sub && <p className="mt-4 text-[16px] leading-relaxed text-[#9C978D]">{sub}</p>}
    </motion.div>
  )
}

function PhoneMock() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-10 -z-10 rounded-full opacity-80 blur-3xl"
        style={{ background: "radial-gradient(50% 50% at 50% 40%, rgba(255,90,56,.35), transparent 70%)" }}
      />
      <div
        className="relative mx-auto w-[276px] overflow-hidden rounded-[2.3rem] border border-[#3A342C] shadow-[0_40px_100px_rgba(0,0,0,.6)]"
        style={{ aspectRatio: "9 / 16", background: "linear-gradient(165deg,#241722,#0E0A12)" }}
      >
        <div
          className="pointer-events-none absolute -left-12 top-10 h-48 w-48 rounded-full opacity-70 blur-2xl"
          style={{ background: "radial-gradient(circle,#FF5A38,transparent 70%)" }}
        />
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-semibold text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A38] shadow-[0_0_8px_#FF5A38]" /> Horror Short
          </span>
          <span className="rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-white/80">9:16</span>
        </div>

        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center">
          <p className="font-display text-[27px] font-extrabold leading-[1.04] tracking-tight text-white drop-shadow">
            Nobody knew what was <span className="text-[#FF7A5C]">behind</span> the door
          </p>
        </div>

        <div className="absolute inset-x-4 bottom-4">
          <div className="mb-2 flex items-end gap-[3px]">
            {[12, 22, 9, 26, 15, 30, 11, 24, 8, 28, 18, 13, 25, 10, 21, 9].map((h, i) => (
              <span key={i} className="w-[3px] flex-1 rounded-full bg-[#FF5A38]/50" style={{ height: h }} />
            ))}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/12">
            <div className="h-full w-1/2 rounded-full bg-[#FF5A38] shadow-[0_0_12px_#FF5A38]" />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[9.5px] text-white/50">
            <span>0:15</span>
            <span>0:30</span>
          </div>
        </div>
      </div>

      {/* floating chips */}
      {[
        { label: "AI voiceover", cls: "-left-10 top-10" },
        { label: "Karaoke captions", cls: "-right-12 top-1/3" },
        { label: "Mood music", cls: "-left-8 bottom-16" },
      ].map((c) => (
        <motion.span
          key={c.label}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className={`absolute hidden rounded-xl border border-[#2E2A24] bg-[#16130E]/90 px-3 py-2 text-[12px] font-semibold text-[#F2F0EB] shadow-[0_10px_30px_rgba(0,0,0,.5)] backdrop-blur lg:flex ${c.cls}`}
        >
          <Check className="mr-1.5 h-3.5 w-3.5 text-[#FF8A5C]" />
          {c.label}
        </motion.span>
      ))}
    </div>
  )
}

/* ------------------------------- Navbar -------------------------------- */
function Navbar() {
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const { isAuthenticated, initials } = useLandingAuth()
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-[#242019] bg-[#0D0C0A]/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF5A38] shadow-[0_0_24px_rgba(255,90,56,.5)]">
            <Flame className="h-[18px] w-[18px] text-black" />
          </span>
          <span className="font-display text-[19px] font-bold tracking-tight text-white">ViralForge</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[14px] font-medium text-[#9C978D] transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          {isAuthenticated ? (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5A38]/12 text-[12px] font-bold text-[#FF8A5C]">
                {initials || "•"}
              </span>
              <Link
                href={LINKS.app}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF5A38] px-4 py-2 text-[14px] font-bold text-black shadow-[0_0_24px_rgba(255,90,56,.4)] transition-transform hover:-translate-y-0.5"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <Link href={LINKS.signIn} className="rounded-lg px-3.5 py-2 text-[14px] font-semibold text-[#F2F0EB] transition-colors hover:bg-white/5">
                Sign in
              </Link>
              <Link
                href={LINKS.start}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF5A38] px-4 py-2 text-[14px] font-bold text-black shadow-[0_0_24px_rgba(255,90,56,.4)] transition-transform hover:-translate-y-0.5"
              >
                Start free
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-[#242019] bg-[#0D0C0A] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#F2F0EB] hover:bg-white/5"
              >
                {l.label}
              </a>
            ))}
            {isAuthenticated ? (
              <Link href={LINKS.app} className="mt-2 rounded-lg bg-[#FF5A38] px-3 py-2.5 text-center text-[14px] font-bold text-black">
                Go to dashboard
              </Link>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href={LINKS.signIn} className="rounded-lg border border-[#2A2620] px-3 py-2.5 text-center text-[14px] font-semibold text-[#F2F0EB]">
                  Sign in
                </Link>
                <Link href={LINKS.start} className="rounded-lg bg-[#FF5A38] px-3 py-2.5 text-center text-[14px] font-bold text-black">
                  Start free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

/* -------------------------------- Hero --------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 70% 0%, rgba(255,90,56,.16), transparent 60%), radial-gradient(50% 40% at 10% 20%, rgba(138,87,216,.10), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#FFF 1px, transparent 1px), linear-gradient(90deg,#FFF 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8">
        <motion.div variants={rise} initial="hidden" animate="show">
          <Eyebrow>AI shorts studio</Eyebrow>
          <h1 className="font-display mt-6 text-[46px] font-extrabold leading-[0.96] tracking-tight text-white sm:text-[66px]">
            Make shorts that{" "}
            <span className="text-[#FF6A45]" style={{ textShadow: "0 0 48px rgba(255,90,56,.55)" }}>
              stop the scroll.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#A6A29A]">
            Drop a prompt, a script, or a YouTube link. ViralForge writes it, voices it, captions it and
            edits it into a post-ready vertical video — while you do literally anything else.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={LINKS.start}
              className="group inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[#FF5A38] px-7 text-[16px] font-bold text-black shadow-[0_0_40px_rgba(255,90,56,.45)] transition-transform hover:-translate-y-0.5"
            >
              Start creating
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={LINKS.templates}
              className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full border border-[#3A342C] px-7 text-[16px] font-bold text-white transition-colors hover:border-white/60"
            >
              <Play className="h-4 w-4 fill-current" />
              See the templates
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-[#9C978D]">
            {["Fresh credits every day", "No filming, no editing", "Cancel anytime"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3FB985]" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
          <PhoneMock />
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------- Stats --------------------------------- */
function StatsStrip() {
  return (
    <section className="border-y border-[#242019] bg-[#100E0B]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="border-[#242019] py-8 text-center [&:not(:last-child)]:md:border-r">
            <div className="font-display text-[30px] font-bold tracking-tight text-white">{s.value}</div>
            <div className="mt-1 text-[13px] text-[#9C978D]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------- Templates ------------------------------- */
function Templates({ templates }: { templates: Template[] }) {
  return (
    <section id="templates" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow="What you can make"
          title={`${templates.length} ways to go`}
          accent="viral."
          sub="Every template is a full pipeline — script, voiceover, captions and music included. Pick one and go."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => {
            const pal = paletteFor(i)
            return (
              <motion.div
                key={t.key}
                variants={rise}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="group overflow-hidden rounded-2xl border border-[#242019] bg-[#141210] transition-all hover:-translate-y-1 hover:border-[#FF5A38]/40 hover:shadow-[0_24px_60px_rgba(255,90,56,.12)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden" style={{ background: pal.bg }}>
                  <TemplateArt kind={artKindFor(t.key)} accent={pal.a} />
                  {t.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-[#FF8A5C] backdrop-blur">
                      {t.badge}
                    </span>
                  )}
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/45 px-2 py-1 text-[10.5px] font-bold text-white backdrop-blur">
                    <Zap className="h-3 w-3 fill-current text-[#FF8A5C]" />
                    {t.credits}
                  </span>
                </div>
                <div className="p-5">
                  <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#FF8A5C]">{t.tagline}</div>
                  <h3 className="font-display mt-1.5 text-[19px] font-bold tracking-tight text-white">{t.name}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#9C978D]">{t.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- How it works ----------------------------- */
function HowItWorks() {
  return (
    <section id="how" className="border-y border-[#242019] bg-[#100E0B] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow="How it works" title="From idea to upload in" accent="three steps." />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              variants={rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08 }}
              className="relative overflow-hidden rounded-2xl border border-[#242019] bg-[#161310] p-7"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF5A38]/12 text-[#FF8A5C]">
                  <s.icon className="h-6 w-6" />
                </span>
                <span className="font-display text-[42px] font-extrabold leading-none text-white/[0.06]">{s.n}</span>
              </div>
              <h3 className="font-display mt-5 text-[19px] font-bold tracking-tight text-white">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#9C978D]">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ Features ------------------------------- */
function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow="Everything included"
          title="No add-ons. No hidden"
          accent="fees."
          sub="The whole studio ships in the box. Every credit you spend makes a finished, post-ready video."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.06 }}
              className="rounded-2xl border border-[#242019] bg-[#141210] p-6 transition-colors hover:border-[#FF5A38]/30"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF5A38]/12 text-[#FF8A5C]">
                <f.icon className="h-[22px] w-[22px]" />
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-white">{f.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#9C978D]">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------- Testimonials ------------------------------ */
function Testimonials() {
  return (
    <section className="border-y border-[#242019] bg-[#100E0B] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow="Loved by creators" title="Built for people who" accent="post daily." />
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              variants={rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 2) * 0.06 }}
              className="rounded-2xl border border-[#242019] bg-[#161310] p-7"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-[#FF8A5C] text-[#FF8A5C]" />
                ))}
              </div>
              <blockquote className="text-[16px] leading-relaxed text-[#F2F0EB]">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5A38]/12 text-[13px] font-bold text-[#FF8A5C]">
                  {t.avatar}
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-white">{t.name}</span>
                  <span className="block text-[12.5px] text-[#9C978D]">{t.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ Pricing -------------------------------- */
function Pricing() {
  const [interval, setInterval] = React.useState<"month" | "year">("month")
  const price = (t: Tier) => (interval === "year" ? yearlyPrice(t.monthly) : t.monthly)

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow="Simple, credit-based pricing"
          title="Refills every"
          accent="single day."
          sub="Spend credits on any template — pay only for what you make. Every plan resets your balance daily."
        />

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-[#2A2620] bg-[#141210] p-1">
            {(["month", "year"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setInterval(opt)}
                className={`rounded-full px-5 py-2 text-[13.5px] font-bold transition-colors ${
                  interval === opt ? "bg-[#FF5A38] text-black" : "text-[#9C978D] hover:text-white"
                }`}
              >
                {opt === "month" ? "Monthly" : "Yearly"}
                {opt === "year" && (
                  <span className={`ml-2 text-[11px] font-bold ${interval === "year" ? "text-black/70" : "text-[#FF8A5C]"}`}>−25%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t) => {
            const popular = t.popular
            return (
              <motion.div
                key={t.name}
                variants={rise}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className={`relative flex flex-col rounded-3xl p-8 ${
                  popular
                    ? "border border-[#FF5A38]/40 bg-[#181310] shadow-[0_0_60px_rgba(255,90,56,.15)]"
                    : "border border-[#242019] bg-[#141210]"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-8 rounded-full bg-[#FF5A38] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-black shadow-[0_0_20px_rgba(255,90,56,.5)]">
                    Most popular
                  </span>
                )}
                <h3 className="text-[15px] font-bold uppercase tracking-wide text-[#9C978D]">{t.name}</h3>
                <div className="mt-3 flex items-baseline gap-1.5 text-white">
                  <span className="font-display text-[46px] font-extrabold tracking-tight">${price(t)}</span>
                  <span className="text-[#6E6A62]">/{interval === "year" ? "yr" : "mo"}</span>
                </div>
                <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#FF5A38]/12 px-2.5 py-1 text-[13px] font-bold text-[#FF8A5C]">
                  <Zap className="h-4 w-4 fill-current" />
                  {t.dailyCredits.toLocaleString()} credits / day
                </div>
                <p className="mt-3 text-[13.5px] text-[#9C978D]">{t.description}</p>

                <ul className="mt-6 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px]">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF8A5C]" />
                      <span className="text-[#D9D5CD]">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={LINKS.pricing}
                  className={`mt-8 inline-flex h-12 items-center justify-center rounded-xl text-[14.5px] font-bold transition-transform hover:-translate-y-0.5 ${
                    popular ? "bg-[#FF5A38] text-black shadow-[0_0_30px_rgba(255,90,56,.4)]" : "border border-[#3A342C] text-white hover:border-white/60"
                  }`}
                >
                  Get {t.name}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- CTA ---------------------------------- */
function FinalCta() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-[#2A2620] bg-[#141210] px-8 py-16 text-center sm:px-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 80% at 50% 0%, rgba(255,90,56,.25), transparent 65%)" }}
        />
        <div className="relative">
          <h2 className="font-display mx-auto max-w-2xl text-[34px] font-extrabold leading-[1.04] tracking-tight text-white sm:text-[48px]">
            Your next video is a few credits away.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-[#A6A29A]">
            Start free, make your first short today, and only pay when you love what you make.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={LINKS.start}
              className="group inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[#FF5A38] px-8 text-[16px] font-bold text-black shadow-[0_0_40px_rgba(255,90,56,.5)] transition-transform hover:-translate-y-0.5"
            >
              Start creating
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={LINKS.pricing}
              className="inline-flex h-[54px] items-center justify-center rounded-full border border-[#3A342C] px-8 text-[16px] font-bold text-white transition-colors hover:border-white/60"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- Footer -------------------------------- */
function Footer() {
  return (
    <footer className="border-t border-[#242019] bg-[#0D0C0A]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF5A38] shadow-[0_0_20px_rgba(255,90,56,.4)]">
                <Flame className="h-[18px] w-[18px] text-black" />
              </span>
              <span className="font-display text-[19px] font-bold tracking-tight text-white">ViralForge</span>
            </Link>
            <p className="mt-3 max-w-xs text-[13.5px] text-[#9C978D]">
              Faceless short-form video, scripted, voiced and edited by AI.
            </p>
          </div>
          <div className="flex gap-4">
            {[Twitter, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2A2620] text-[#9C978D] transition-colors hover:border-white/60 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#242019] pt-6 text-[13px] text-[#6E6A62] sm:flex-row">
          <span>© {new Date().getFullYear()} ViralForge. All rights reserved.</span>
          <span className="flex gap-5">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </span>
        </div>
      </div>
    </footer>
  )
}

export default function LandingCinematic({ templates = TEMPLATES }: { templates?: Template[] }) {
  return (
    <main className="min-h-screen bg-[#0D0C0A] font-sans text-[#F2F0EB] antialiased">
      <Navbar />
      <Hero />
      <StatsStrip />
      <Templates templates={templates} />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Pricing />
      <FinalCta />
      <Footer />
    </main>
  )
}
