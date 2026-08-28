"use client"

import * as React from "react"
import { ArrowRight, ChevronDown } from "lucide-react"
import { C, Holo, Lozenge, glassCard } from "@/components/landing/variants/liquidglass"
import { MarketingShell, PageHero, Block } from "@/components/marketing/marketing-shell"
import { FAQS, LINKS } from "@/components/landing/shared/content"

/**
 * The FAQ page.
 *
 * Every answer is rendered EXPANDED and in the HTML — no accordion that hides
 * text behind a click. Google indexes hidden text, but a person landing here
 * from a search wants the answer visible immediately, and the FAQPage schema on
 * this route promises the same words the page shows.
 */
export function FaqPage() {
  return (
    <MarketingShell>
      <PageHero
        trail={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
        eyebrow="Questions"
        title="Everything people ask"
        accent="before signing up."
        sub="If something is not answered here, the template pages go into detail on what each one takes in and gives back."
      />

      <Block id="questions" title="Frequently asked questions">
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <Holo key={faq.q} className="p-6">
              <h3 className="font-display text-[16px] font-bold tracking-tight" style={{ color: C.ink }}>
                {faq.q}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed" style={{ color: C.ink2 }}>
                {faq.a}
              </p>
            </Holo>
          ))}
        </div>
      </Block>

      <Block id="more" title="Still deciding?">
        <div className="flex flex-wrap gap-3">
          <Lozenge href="/templates">Compare the templates</Lozenge>
          <Lozenge href="/pricing">See pricing</Lozenge>
          <Lozenge href="/how-it-works">How it works</Lozenge>
        </div>
      </Block>

      <section className="px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Lozenge href={LINKS.start} primary>
            Start creating free
            <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
          </Lozenge>
        </div>
      </section>
    </MarketingShell>
  )
}
