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
  Sparkles,
  Twitter,
  Instagram,
  Youtube,
  Zap,
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
} from "@/components/landing/shared/content"
import { TemplateArt, artKindFor, paletteFor } from "@/components/dashboard/template-art"
import { useLandingAuth } from "@/components/landing/shared/useLandingAuth"

/* Warm editorial palette — locked with explicit colors so the marketing page
   always reads as designed regardless of the app's light/dark preference. */
const C = {
  bg: "#FBFAF8",
  ink: "#1A1916",
  ink2: "#6B6862",
  ink3: "#A09C94",
  card: "#FFFFFF",
  border: "#E9E6E0",
  line: "#F1EFEA",
  inset: "#F7F5F1",
  accent: "#E8492B",
  accentSoft: "#FCEDE8",
  accentLine: "#F2C3B6",
}

const rise = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#F2C3B6] bg-[#FCEDE8] px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#E8492B]">
      <Sparkles className="h-3.5 w-3.5" />
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
      <h2 className="font-display mt-5 text-[34px] font-bold leading-[1.05] tracking-tight text-[#1A1916] sm:text-[44px]">
        {title} {accent && <span className="text-[#E8492B]">{accent}</span>}
      </h2>
      {sub && <p className="mt-4 text-[16px] leading-relaxed text-[#6B6862]">{sub}</p>}
    </motion.div>
  )
}

function PhoneMock() {
  return (
    <div className="relative">
      {/* soft accent glow */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] opacity-70 blur-2xl"
        style={{ background: "radial-gradient(60% 60% at 60% 30%, rgba(232,73,43,.22), transparent 70%)" }}
      />
      <div
        className="relative mx-auto w-[266px] overflow-hidden rounded-[2.2rem] border-[6px] border-[#1A1916] shadow-[0_30px_80px_rgba(26,25,22,.28)]"
        style={{ aspectRatio: "9 / 16", background: "linear-gradient(165deg,#241C2E,#141019)" }}
      >
        {/* ambient art */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-60 blur-2xl"
          style={{ background: "radial-gradient(circle,#E8492B,transparent 70%)" }}
        />
        {/* top chip */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[10.5px] font-semibold text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8492B]" /> AI Explainer
          </span>
          <span className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-white/80">
            9:16
          </span>
        </div>

        {/* karaoke caption */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center">
          <p className="font-display text-[26px] font-extrabold leading-[1.05] tracking-tight text-white drop-shadow">
            This one trick <span className="text-[#FF7A5C]">changed</span> everything
          </p>
        </div>

        {/* bottom: waveform + progress */}
        <div className="absolute inset-x-4 bottom-4">
          <div className="mb-2 flex items-end gap-[3px]">
            {[10, 18, 8, 22, 14, 26, 12, 20, 9, 24, 16, 11, 21, 13, 19, 7].map((h, i) => (
              <span
                key={i}
                className="w-[3px] flex-1 rounded-full bg-white/40"
                style={{ height: h }}
              />
            ))}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-[42%] rounded-full bg-[#E8492B]" />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[9.5px] text-white/60">
            <span>0:12</span>
            <span>0:30</span>
          </div>
        </div>
      </div>

      {/* floating recipe card */}
      <motion.div
        initial={{ opacity: 0, y: 14, x: 10 }}
        whileInView={{ opacity: 1, y: 0, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="absolute -bottom-6 -left-8 hidden w-[214px] rounded-2xl border border-[#E9E6E0] bg-white p-4 shadow-[0_18px_50px_rgba(26,25,22,.16)] sm:block"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#1A1916]">Auto-built for you</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-[#FCEDE8] px-1.5 py-0.5 text-[10.5px] font-bold text-[#E8492B]">
            <Zap className="h-3 w-3 fill-current" /> −6
          </span>
        </div>
        <ul className="space-y-1.5">
          {["Script written", "Voiceover recorded", "Captions burned in", "Music added"].map((s) => (
            <li key={s} className="flex items-center gap-2 text-[12px] text-[#6B6862]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#E7F4EE]">
                <Check className="h-2.5 w-2.5 text-[#1F9E6B]" />
              </span>
              {s}
            </li>
          ))}
        </ul>
      </motion.div>
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
        scrolled ? "border-b border-[#E9E6E0] bg-[#FBFAF8]/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8492B] shadow-[0_6px_16px_rgba(232,73,43,.35)]">
            <Flame className="h-[18px] w-[18px] text-white" />
          </span>
          <span className="font-display text-[19px] font-bold tracking-tight text-[#1A1916]">ViralForge</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[14px] font-medium text-[#6B6862] transition-colors hover:text-[#1A1916]">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          {isAuthenticated ? (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FCEDE8] text-[12px] font-bold text-[#E8492B]">
                {initials || "•"}
              </span>
              <Link
                href={LINKS.app}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8492B] px-4 py-2 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(232,73,43,.28)] transition-transform hover:-translate-y-0.5"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <Link href={LINKS.signIn} className="rounded-lg px-3.5 py-2 text-[14px] font-semibold text-[#1A1916] transition-colors hover:bg-[#F4F2EE]">
                Sign in
              </Link>
              <Link
                href={LINKS.start}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8492B] px-4 py-2 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(232,73,43,.28)] transition-transform hover:-translate-y-0.5"
              >
                Start free
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-6 w-6 text-[#1A1916]" /> : <Menu className="h-6 w-6 text-[#1A1916]" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-[#E9E6E0] bg-[#FBFAF8] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#1A1916] hover:bg-[#F4F2EE]"
              >
                {l.label}
              </a>
            ))}
            {isAuthenticated ? (
              <Link href={LINKS.app} className="mt-2 rounded-lg bg-[#E8492B] px-3 py-2.5 text-center text-[14px] font-bold text-white">
                Go to dashboard
              </Link>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href={LINKS.signIn} className="rounded-lg border border-[#E9E6E0] px-3 py-2.5 text-center text-[14px] font-semibold text-[#1A1916]">
                  Sign in
                </Link>
                <Link href={LINKS.start} className="rounded-lg bg-[#E8492B] px-3 py-2.5 text-center text-[14px] font-bold text-white">
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
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{ background: "radial-gradient(50% 60% at 80% 0%, rgba(232,73,43,.08), transparent 70%)" }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8">
        <motion.div variants={rise} initial="hidden" animate="show">
          <Eyebrow>AI shorts studio</Eyebrow>
          <h1 className="font-display mt-6 text-[44px] font-extrabold leading-[0.98] tracking-tight text-[#1A1916] sm:text-[62px]">
            Turn a link or an idea into a <span className="text-[#E8492B]">video worth posting.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#6B6862]">
            ViralForge scripts, voices, captions and edits short-form videos for you — from a prompt, a
            script, or a YouTube link. Pick a template, spend a few credits, download your video.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={LINKS.start}
              className="group inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[#E8492B] px-7 text-[16px] font-bold text-white shadow-[0_14px_32px_rgba(232,73,43,.3)] transition-transform hover:-translate-y-0.5"
            >
              Start creating
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={LINKS.templates}
              className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full border border-[#E9E6E0] bg-white px-7 text-[16px] font-bold text-[#1A1916] transition-colors hover:border-[#1A1916]"
            >
              <Play className="h-4 w-4 fill-current" />
              See the templates
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-[#6B6862]">
            {["Fresh credits every day", "No filming, no editing", "Cancel anytime"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1F9E6B]" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" transition={{ delay: 0.15 }} className="relative">
          <PhoneMock />
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------- Stats --------------------------------- */
function StatsStrip() {
  return (
    <section className="border-y border-[#E9E6E0] bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="py-8 text-center">
            <div className="font-display text-[30px] font-bold tracking-tight text-[#1A1916]">{s.value}</div>
            <div className="mt-1 text-[13px] text-[#6B6862]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------- Templates ------------------------------- */
function Templates() {
  return (
    <section id="templates" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow="What you can make"
          title="Six ways to go"
          accent="viral."
          sub="Every template is a full pipeline — script, voiceover, captions and music included. Pick one and go."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t, i) => {
            const pal = paletteFor(i)
            return (
              <motion.div
                key={t.key}
                variants={rise}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="group overflow-hidden rounded-2xl border border-[#E9E6E0] bg-white shadow-[0_1px_2px_rgba(26,25,22,.04)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(26,25,22,.12)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden" style={{ background: pal.bg }}>
                  <TemplateArt kind={artKindFor(t.key)} accent={pal.a} />
                  {t.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-[#1A1916] backdrop-blur">
                      {t.badge}
                    </span>
                  )}
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/35 px-2 py-1 text-[10.5px] font-bold text-white backdrop-blur">
                    <Zap className="h-3 w-3 fill-current text-[#FF7A5C]" />
                    {t.credits}
                  </span>
                </div>
                <div className="p-5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#A09C94]">{t.tagline}</div>
                  <h3 className="font-display mt-1.5 text-[19px] font-bold tracking-tight text-[#1A1916]">{t.name}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#6B6862]">{t.description}</p>
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
    <section id="how" className="border-y border-[#E9E6E0] bg-[#F7F5F1] py-24">
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
              className="relative rounded-2xl border border-[#E9E6E0] bg-white p-7"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCEDE8] text-[#E8492B]">
                  <s.icon className="h-6 w-6" />
                </span>
                <span className="font-display text-[40px] font-extrabold leading-none text-[#F1EFEA]">{s.n}</span>
              </div>
              <h3 className="font-display mt-5 text-[19px] font-bold tracking-tight text-[#1A1916]">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B6862]">{s.description}</p>
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
          sub="The whole studio comes in the box. Every credit you spend makes a finished, post-ready video."
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
              className="rounded-2xl border border-[#E9E6E0] bg-white p-6 transition-colors hover:border-[#F2C3B6]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCEDE8] text-[#E8492B]">
                <f.icon className="h-[22px] w-[22px]" />
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-[#1A1916]">{f.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6B6862]">{f.description}</p>
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
    <section className="border-y border-[#E9E6E0] bg-[#F7F5F1] py-24">
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
              className="rounded-2xl border border-[#E9E6E0] bg-white p-7"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-[#E8492B] text-[#E8492B]" />
                ))}
              </div>
              <blockquote className="text-[16px] leading-relaxed text-[#1A1916]">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FCEDE8] text-[13px] font-bold text-[#E8492B]">
                  {t.avatar}
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-[#1A1916]">{t.name}</span>
                  <span className="block text-[12.5px] text-[#6B6862]">{t.role}</span>
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
          <div className="inline-flex rounded-full border border-[#E9E6E0] bg-white p-1">
            {(["month", "year"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setInterval(opt)}
                className={`rounded-full px-5 py-2 text-[13.5px] font-bold transition-colors ${
                  interval === opt ? "bg-[#1A1916] text-white" : "text-[#6B6862] hover:text-[#1A1916]"
                }`}
              >
                {opt === "month" ? "Monthly" : "Yearly"}
                {opt === "year" && <span className="ml-2 text-[11px] font-bold text-[#E8492B]">−25%</span>}
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
                    ? "bg-[#1A1916] text-white shadow-[0_30px_70px_rgba(26,25,22,.3)]"
                    : "border border-[#E9E6E0] bg-white"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-8 rounded-full bg-[#E8492B] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <h3 className={`text-[15px] font-bold uppercase tracking-wide ${popular ? "text-white/80" : "text-[#6B6862]"}`}>
                  {t.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-display text-[46px] font-extrabold tracking-tight">${price(t)}</span>
                  <span className={popular ? "text-white/60" : "text-[#A09C94]"}>/{interval === "year" ? "yr" : "mo"}</span>
                </div>
                <div
                  className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-bold ${
                    popular ? "bg-white/12 text-white" : "bg-[#FCEDE8] text-[#E8492B]"
                  }`}
                >
                  <Zap className="h-4 w-4 fill-current" />
                  {t.dailyCredits.toLocaleString()} credits / day
                </div>
                <p className={`mt-3 text-[13.5px] ${popular ? "text-white/70" : "text-[#6B6862]"}`}>{t.description}</p>

                <ul className="mt-6 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px]">
                      <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${popular ? "text-[#FF7A5C]" : "text-[#E8492B]"}`} />
                      <span className={popular ? "text-white/90" : "text-[#1A1916]"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={LINKS.pricing}
                  className={`mt-8 inline-flex h-12 items-center justify-center rounded-xl text-[14.5px] font-bold transition-transform hover:-translate-y-0.5 ${
                    popular ? "bg-[#E8492B] text-white" : "bg-[#1A1916] text-white"
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
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-[#1A1916] px-8 py-16 text-center sm:px-16">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle,rgba(232,73,43,.45),transparent 70%)" }}
        />
        <div className="relative">
          <h2 className="font-display mx-auto max-w-2xl text-[34px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[46px]">
            Your next video is a few credits away.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-white/70">
            Start free, make your first short today, and only pay when you love what you make.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={LINKS.start}
              className="group inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[#E8492B] px-8 text-[16px] font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Start creating
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={LINKS.pricing}
              className="inline-flex h-[54px] items-center justify-center rounded-full border border-white/20 px-8 text-[16px] font-bold text-white transition-colors hover:bg-white/10"
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
    <footer className="border-t border-[#E9E6E0] bg-[#FBFAF8]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8492B]">
                <Flame className="h-[18px] w-[18px] text-white" />
              </span>
              <span className="font-display text-[19px] font-bold tracking-tight text-[#1A1916]">ViralForge</span>
            </Link>
            <p className="mt-3 max-w-xs text-[13.5px] text-[#6B6862]">
              Faceless short-form video, scripted, voiced and edited by AI.
            </p>
          </div>
          <div className="flex gap-4">
            {[Twitter, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E9E6E0] text-[#6B6862] transition-colors hover:border-[#1A1916] hover:text-[#1A1916]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#E9E6E0] pt-6 text-[13px] text-[#A09C94] sm:flex-row">
          <span>© {new Date().getFullYear()} ViralForge. All rights reserved.</span>
          <span className="flex gap-5">
            <a href="#" className="hover:text-[#1A1916]">Privacy</a>
            <a href="#" className="hover:text-[#1A1916]">Terms</a>
          </span>
        </div>
      </div>
    </footer>
  )
}

export default function LandingEditorial() {
  return (
    <main className="min-h-screen bg-[#FBFAF8] font-sans text-[#1A1916] antialiased">
      <Navbar />
      <Hero />
      <StatsStrip />
      <Templates />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Pricing />
      <FinalCta />
      <Footer />
    </main>
  )
}
