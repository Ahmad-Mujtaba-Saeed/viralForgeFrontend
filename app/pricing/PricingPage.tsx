"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"
import { C, IRIS, Holo, Lozenge, rise, stagger } from "@/components/landing/variants/liquidglass"
import { MarketingShell, PageHero, Block, Prose } from "@/components/marketing/marketing-shell"
import {
  TIERS,
  LINKS,
  yearlyPrice,
  templateSlug,
  type Template,
} from "@/components/landing/shared/content"

/**
 * The pricing page. Deliberately more than the landing's pricing section: the
 * plan ladder is the same, but this page also answers what a credit actually
 * buys — the per-template cost table — which is the question that follows.
 */
export function PricingPage({ templates }: { templates: Template[] }) {
  const [yearly, setYearly] = React.useState(false)

  return (
    <MarketingShell>
      <PageHero
        trail={[{ label: "Home", href: "/" }, { label: "Pricing" }]}
        eyebrow="Pricing"
        title="Credits that"
        accent="refill every day."
        sub="Every plan gives you a credit balance that tops back up daily. A render costs credits according to how expensive the template is to run — and if a render fails, the credits come back."
      >
        <div className="mt-8 inline-flex rounded-full border p-1" style={{ borderColor: C.line, background: C.glass }}>
          {(["monthly", "yearly"] as const).map((mode) => {
            const active = (mode === "yearly") === yearly
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setYearly(mode === "yearly")}
                aria-pressed={active}
                className="rounded-full px-4 py-2 text-[13px] font-bold capitalize transition-colors"
                style={active ? { background: "#fff", color: C.ink } : { color: C.ink2 }}
              >
                {mode}
                {mode === "yearly" && <span className="ml-1.5 opacity-70">−25%</span>}
              </button>
            )
          })}
        </div>
      </PageHero>

      <Block id="plans" title="Plans" wide>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-5 lg:grid-cols-3"
        >
          {TIERS.map((tier) => (
            <motion.div key={tier.name} variants={rise}>
              <Holo className={`h-full p-7 ${tier.popular ? "ring-2 ring-offset-0" : ""}`}>
                {tier.popular && (
                  <span
                    className="mb-4 inline-block rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white"
                    style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.pink})` }}
                  >
                    Most popular
                  </span>
                )}
                <h3 className="text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: C.ink3 }}>
                  {tier.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span
                    className="font-display text-[40px] font-extrabold tracking-tight"
                    style={{ background: IRIS, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
                  >
                    ${yearly ? yearlyPrice(tier.monthly) : tier.monthly}
                  </span>
                  <span className="text-[14px] font-semibold" style={{ color: C.ink3 }}>
                    /{yearly ? "year" : "month"}
                  </span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>
                  {tier.description}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: C.ink2 }}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.violet }} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <Lozenge href={LINKS.start} primary={tier.popular} className="w-full justify-center">
                    Get started
                  </Lozenge>
                </div>
              </Holo>
            </motion.div>
          ))}
        </motion.div>
      </Block>

      <Block
        id="credits"
        title="What a render costs"
        sub="Credits are charged when a render starts and returned if it fails. Costs differ because some templates call paid AI generation and others only edit footage you already have."
        wide
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Credit cost per Vreato video template</caption>
            <thead>
              <tr style={{ color: C.ink3 }}>
                <th scope="col" className="border-b px-3 py-3 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ borderColor: C.lineSoft }}>
                  Template
                </th>
                <th scope="col" className="border-b px-3 py-3 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ borderColor: C.lineSoft }}>
                  Credits per render
                </th>
                <th scope="col" className="border-b px-3 py-3 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ borderColor: C.lineSoft }}>
                  Renders on 300/day
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.key}>
                  <th scope="row" className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: C.lineSoft, color: C.ink }}>
                    <Link href={`/templates/${templateSlug(t.key)}`} className="hover:opacity-70">
                      {t.name}
                    </Link>
                  </th>
                  <td className="border-b px-3 py-3.5" style={{ borderColor: C.lineSoft, color: C.ink2 }}>{t.credits}</td>
                  <td className="border-b px-3 py-3.5" style={{ borderColor: C.lineSoft, color: C.ink2 }}>
                    {t.credits > 0 ? `~${Math.floor(300 / t.credits)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>

      <Block id="billing-faq" title="About billing">
        <div className="space-y-5">
          <Prose>
            <p>
              <strong style={{ color: C.ink }}>Credits refill daily, not monthly.</strong> Your balance
              returns to the plan's daily allowance every day, so the plan is a rate limit rather than a
              pot you can run dry in the first week.
            </p>
            <p>
              <strong style={{ color: C.ink }}>A failed render costs nothing.</strong> Credits are
              charged when a render starts and returned automatically if it does not finish.
            </p>
            <p>
              <strong style={{ color: C.ink }}>Voiceover and captions are never extra.</strong> AI
              narration and word-by-word captions are part of every template at no per-word cost, on
              every plan.
            </p>
            <p>
              <strong style={{ color: C.ink }}>Every plan gets every template.</strong> Plans differ by
              how much you can render per day and where you sit in the render queue — not by which
              features you are allowed to use.
            </p>
          </Prose>
        </div>
      </Block>

      <section className="px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-3">
          <Lozenge href={LINKS.start} primary>
            Start creating free
            <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
          </Lozenge>
          <Lozenge href="/faq">Read the FAQ</Lozenge>
        </div>
      </section>
    </MarketingShell>
  )
}
