"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useScroll, useSpring } from "framer-motion"
import { ChevronRight } from "lucide-react"
import {
  C,
  IRIS,
  PrismBackdrop,
  Navbar,
  Footer,
} from "@/components/landing/variants/liquidglass"

/**
 * The chrome every marketing page outside the landing shares: prism backdrop,
 * fixed navbar, scroll-progress bar and footer.
 *
 * The pieces come from the Liquid Glass landing rather than being re-styled
 * here, because that variant IS the shipped site skin — a second definition
 * would drift the moment either side is touched. If the shipped variant ever
 * changes, this import is the single place that has to move.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  const { scrollY, scrollYProgress } = useScroll()
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
      <PrismBackdrop scrollYProgress={scrollYProgress} />
      <motion.div
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left"
        style={{ scaleX: progress, background: IRIS }}
      />
      <Navbar scrollY={scrollY} />
      {children}
      <Footer />
    </main>
  )
}

export type Crumb = { label: string; href?: string }

/**
 * Visible breadcrumbs. The matching BreadcrumbList JSON-LD is emitted by the
 * server component that renders the page — Google wants both, and the two must
 * describe the same trail.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold">
        {trail.map((crumb, i) => (
          <li key={crumb.label} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5" style={{ color: C.ink3 }} aria-hidden="true" />
            )}
            {crumb.href ? (
              <Link href={crumb.href} style={{ color: C.ink2 }} className="hover:opacity-70">
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: C.ink3 }} aria-current="page">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * The top of a sub-page: breadcrumbs, the page's single <h1>, and a standfirst.
 * `accent` is the half of the headline that takes the iridescent sweep, so
 * every page's title reads like the landing's.
 */
export function PageHero({
  trail,
  eyebrow,
  title,
  accent,
  sub,
  children,
}: {
  trail: Crumb[]
  eyebrow: string
  title: string
  accent?: string
  sub?: string
  children?: React.ReactNode
}) {
  return (
    <section className="px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Breadcrumbs trail={trail} />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.12em] backdrop-blur-xl"
            style={{ borderColor: C.line, background: C.glass, color: C.ink2 }}
          >
            {eyebrow}
          </span>
          <h1
            className="font-display mt-5 text-[36px] font-extrabold leading-[1.08] tracking-tight sm:text-[52px]"
            style={{ color: C.ink, letterSpacing: "-0.03em" }}
          >
            {title}
            {accent && (
              <>
                {" "}
                <span
                  style={{
                    background: IRIS,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {accent}
                </span>
              </>
            )}
          </h1>
          {sub && (
            <p className="mt-5 max-w-2xl text-[16.5px] leading-relaxed" style={{ color: C.ink2 }}>
              {sub}
            </p>
          )}
          {children}
        </motion.div>
      </div>
    </section>
  )
}

/** A titled content block with an <h2>, wired for the section's aria-labelledby. */
export function Block({
  id,
  title,
  sub,
  children,
  wide = false,
}: {
  id: string
  title: string
  sub?: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="px-4 py-12 sm:px-6 lg:px-8">
      <div className={wide ? "mx-auto max-w-6xl" : "mx-auto max-w-4xl"}>
        <h2
          id={`${id}-heading`}
          className="font-display text-[26px] font-bold tracking-tight sm:text-[32px]"
          style={{ color: C.ink, letterSpacing: "-0.02em" }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: C.ink2 }}>
            {sub}
          </p>
        )}
        <div className="mt-7">{children}</div>
      </div>
    </section>
  )
}

/** Body copy at the page's reading measure. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed" style={{ color: C.ink2 }}>
      {children}
    </div>
  )
}
