"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Check, Flame, Menu, X, Zap, ArrowUpRight } from "lucide-react"
import { useLandingAuth } from "@/components/landing/shared/useLandingAuth"
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

/* Minimal, clean SaaS palette — neutral + a single restrained accent. */
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <motion.div
      variants={rise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="mx-auto max-w-2xl text-center"
    >
      <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#71717A]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#E8492B]" />
        {eyebrow}
      </span>
      <h2 className="mt-4 text-[30px] font-semibold leading-[1.1] tracking-tight text-[#18181B] sm:text-[38px]">{title}</h2>
      {sub && <p className="mt-3 text-[16px] leading-relaxed text-[#52525B]">{sub}</p>}
    </motion.div>
  )
}

/* Light UI mock: a clean 'create' window with a phone preview. */
function AppMock() {
  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white shadow-[0_30px_70px_rgba(24,24,27,.10)]">
      <div className="flex items-center gap-2 border-b border-[#F0F0F1] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E4E4E7]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E4E4E7]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E4E4E7]" />
        <span className="ml-3 rounded-md bg-[#F4F4F5] px-2.5 py-1 text-[11px] font-medium text-[#71717A]">
          viralforge.app / create
        </span>
      </div>
      <div className="grid gap-6 p-6 sm:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[#A1A1AA]">Template</div>
          <div className="mt-2 space-y-2">
            {TEMPLATES.slice(0, 3).map((t, i) => (
              <div
                key={t.key}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  i === 0 ? "border-[#E8492B]/40 bg-[#FCEDE8]" : "border-[#E4E4E7] bg-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    i === 0 ? "bg-[#E8492B] text-white" : "bg-[#F4F4F5] text-[#52525B]"
                  }`}
                >
                  <t.icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-[#18181B]">{t.name}</div>
                  <div className="truncate text-[11.5px] text-[#71717A]">{t.tagline}</div>
                </div>
                {i === 0 && <Check className="ml-auto h-4 w-4 text-[#E8492B]" />}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#18181B] px-4 py-3">
            <span className="text-[13px] font-semibold text-white">Generate video</span>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/70">
              <Zap className="h-3.5 w-3.5" /> 6 credits
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div
            className="relative w-[128px] overflow-hidden rounded-2xl border border-[#E4E4E7] bg-[#1A1916]"
            style={{ aspectRatio: "9 / 16" }}
          >
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center">
              <p className="text-[15px] font-extrabold leading-tight text-white">
                This <span className="text-[#FF7A5C]">changed</span> it all
              </p>
            </div>
            <div className="absolute inset-x-3 bottom-3">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-2/5 rounded-full bg-[#E8492B]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- Navbar -------------------------------- */
function Navbar() {
  const [open, setOpen] = React.useState(false)
  const { isAuthenticated, initials } = useLandingAuth()
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#EDEDEF] bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8492B]">
            <Flame className="h-4 w-4 text-white" />
          </span>
          <span className="text-[18px] font-semibold tracking-tight text-[#18181B]">ViralForge</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[14px] text-[#52525B] transition-colors hover:text-[#18181B]">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F4F5] text-[12px] font-semibold text-[#18181B]">
                {initials || "•"}
              </span>
              <Link
                href={LINKS.app}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#18181B] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#27272A]"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <Link href={LINKS.signIn} className="text-[14px] font-medium text-[#18181B] hover:text-[#52525B]">
                Log in
              </Link>
              <Link
                href={LINKS.start}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#18181B] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#27272A]"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-6 w-6 text-[#18181B]" /> : <Menu className="h-6 w-6 text-[#18181B]" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-[#EDEDEF] bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] text-[#18181B] hover:bg-[#F4F4F5]">
                {l.label}
              </a>
            ))}
            {isAuthenticated ? (
              <Link href={LINKS.app} className="mt-2 rounded-lg bg-[#18181B] px-3 py-2.5 text-center text-[14px] font-medium text-white">
                Go to dashboard
              </Link>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href={LINKS.signIn} className="rounded-lg border border-[#E4E4E7] px-3 py-2.5 text-center text-[14px] font-medium text-[#18181B]">
                  Log in
                </Link>
                <Link href={LINKS.start} className="rounded-lg bg-[#18181B] px-3 py-2.5 text-center text-[14px] font-medium text-white">
                  Get started
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
    <section className="px-4 pt-32 pb-16 sm:px-6 sm:pt-36 lg:px-8">
      <motion.div variants={rise} initial="hidden" animate="show" className="mx-auto max-w-3xl text-center">
        <Link
          href={LINKS.templates}
          className="inline-flex items-center gap-2 rounded-full border border-[#E4E4E7] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#52525B] transition-colors hover:border-[#D4D4D8]"
        >
          <span className="rounded-full bg-[#E8492B] px-1.5 py-0.5 text-[10.5px] font-bold text-white">6</span>
          templates, one workflow
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <h1 className="mt-7 text-[42px] font-semibold leading-[1.02] tracking-tight text-[#18181B] sm:text-[60px]">
          The fastest way to make
          <br className="hidden sm:block" /> short-form video.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed text-[#52525B]">
          Scripts, voiceover, captions and edits — generated automatically from a prompt, a script, or a
          YouTube link. Pick a template, spend a few credits, download your video.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={LINKS.start}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#18181B] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#27272A]"
          >
            Start creating
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href={LINKS.templates}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#E4E4E7] bg-white px-6 text-[15px] font-medium text-[#18181B] transition-colors hover:border-[#D4D4D8]"
          >
            Browse templates
          </a>
        </div>

        <p className="mt-6 text-[13px] text-[#A1A1AA]">Fresh credits every day · No filming or editing · Cancel anytime</p>
      </motion.div>

      <motion.div variants={rise} initial="hidden" animate="show" transition={{ delay: 0.15 }} className="mt-16">
        <AppMock />
      </motion.div>
    </section>
  )
}

/* ------------------------------- Stats --------------------------------- */
function StatsStrip() {
  return (
    <section className="border-y border-[#EDEDEF]">
      <div className="mx-auto grid max-w-5xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="py-8 text-center">
            <div className="text-[28px] font-semibold tracking-tight text-[#18181B]">{s.value}</div>
            <div className="mt-1 text-[13px] text-[#71717A]">{s.label}</div>
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
          eyebrow="Templates"
          title="Six ways to make a video"
          sub="Each one is a full pipeline — script, voiceover, captions and music included."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[#E4E4E7] bg-[#E4E4E7] sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <motion.div
              key={t.key}
              variants={rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="group flex flex-col bg-white p-7 transition-colors hover:bg-[#FAFAF9]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F4F5] text-[#18181B] transition-colors group-hover:bg-[#FCEDE8] group-hover:text-[#E8492B]">
                  <t.icon className="h-[22px] w-[22px]" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-[#F4F4F5] px-2 py-1 text-[11.5px] font-semibold text-[#52525B]">
                  <Zap className="h-3 w-3" />
                  {t.credits}
                </span>
              </div>
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-[#18181B]">{t.name}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#52525B]">{t.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-[#E8492B] opacity-0 transition-opacity group-hover:opacity-100">
                Use template <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- How it works ----------------------------- */
function HowItWorks() {
  return (
    <section id="how" className="border-y border-[#EDEDEF] bg-[#FAFAF9] py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow="How it works" title="From idea to upload in three steps" />
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {STEPS.map((s) => (
            <motion.div
              key={s.n}
              variants={rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4E4E7] bg-white text-[13px] font-semibold text-[#18181B]">
                  {s.n}
                </span>
                <span className="h-px flex-1 bg-[#E4E4E7]" />
              </div>
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-[#18181B]">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#52525B]">{s.description}</p>
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
          eyebrow="Included"
          title="Everything, in the box"
          sub="No add-ons, no hidden fees. Every credit makes a finished, post-ready video."
        />
        <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="flex gap-4"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#F4F4F5] text-[#18181B]">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-[15.5px] font-semibold text-[#18181B]">{f.title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[#52525B]">{f.description}</p>
              </div>
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
    <section className="border-y border-[#EDEDEF] bg-[#FAFAF9] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow="Testimonials" title="Built for people who post daily" />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t) => (
            <motion.figure
              key={t.name}
              variants={rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="flex flex-col rounded-2xl border border-[#E4E4E7] bg-white p-6"
            >
              <blockquote className="flex-1 text-[14.5px] leading-relaxed text-[#18181B]">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F4F5] text-[12px] font-semibold text-[#18181B]">
                  {t.avatar}
                </span>
                <span>
                  <span className="block text-[13.5px] font-semibold text-[#18181B]">{t.name}</span>
                  <span className="block text-[12px] text-[#71717A]">{t.role}</span>
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
          eyebrow="Pricing"
          title="Credits that refill every day"
          sub="Spend them on any template — pay only for what you make."
        />

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-lg border border-[#E4E4E7] bg-white p-1">
            {(["month", "year"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setInterval(opt)}
                className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  interval === opt ? "bg-[#18181B] text-white" : "text-[#52525B] hover:text-[#18181B]"
                }`}
              >
                {opt === "month" ? "Monthly" : "Yearly"}
                {opt === "year" && (
                  <span className={`ml-1.5 text-[11px] font-semibold ${interval === "year" ? "text-white/70" : "text-[#E8492B]"}`}>
                    −25%
                  </span>
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
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  popular ? "border-[#18181B] bg-white shadow-[0_20px_50px_rgba(24,24,27,.10)]" : "border-[#E4E4E7] bg-white"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-7 rounded-full bg-[#E8492B] px-3 py-1 text-[11px] font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-[15px] font-semibold text-[#18181B]">{t.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-[42px] font-semibold tracking-tight text-[#18181B]">${price(t)}</span>
                  <span className="text-[#A1A1AA]">/{interval === "year" ? "yr" : "mo"}</span>
                </div>
                <div className="mt-2 inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-[#E8492B]">
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  {t.dailyCredits.toLocaleString()} credits / day
                </div>
                <p className="mt-2 text-[13.5px] text-[#52525B]">{t.description}</p>

                <ul className="mt-6 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-[#3F3F46]">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#18181B]" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={LINKS.pricing}
                  className={`mt-7 inline-flex h-11 items-center justify-center rounded-lg text-[14px] font-medium transition-colors ${
                    popular ? "bg-[#18181B] text-white hover:bg-[#27272A]" : "border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8]"
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
    <section className="border-y border-[#EDEDEF] bg-[#FAFAF9] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-[#18181B] sm:text-[42px]">
          Make your first video today.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[16px] text-[#52525B]">
          Start free and only pay when you love what you make.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={LINKS.start}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#18181B] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#27272A]"
          >
            Start creating
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={LINKS.pricing}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-[#E4E4E7] bg-white px-6 text-[15px] font-medium text-[#18181B] transition-colors hover:border-[#D4D4D8]"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- Footer -------------------------------- */
function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8492B]">
            <Flame className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[#18181B]">ViralForge</span>
        </Link>
        <p className="text-[13px] text-[#A1A1AA]">© {new Date().getFullYear()} ViralForge. All rights reserved.</p>
        <div className="flex gap-5 text-[13px] text-[#71717A]">
          <a href="#" className="hover:text-[#18181B]">Privacy</a>
          <a href="#" className="hover:text-[#18181B]">Terms</a>
        </div>
      </div>
    </footer>
  )
}

export default function LandingMinimal() {
  return (
    <main className="min-h-screen bg-white font-sans text-[#18181B] antialiased">
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
