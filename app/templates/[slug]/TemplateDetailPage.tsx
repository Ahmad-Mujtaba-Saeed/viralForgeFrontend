"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Check, Zap } from "lucide-react"
import { C, Holo, Lozenge, rise, stagger } from "@/components/landing/variants/liquidglass"
import { MarketingShell, PageHero, Block } from "@/components/marketing/marketing-shell"
import { TemplateImage } from "@/components/template-image"
import {
  LINKS,
  templateSlug,
  type Template,
  type TemplateDetail,
} from "@/components/landing/shared/content"

/** A labelled list of short facts — inputs, outputs, who it's for. */
function TickList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed" style={{ color: C.ink2 }}>
          <Check className="mt-1 h-4 w-4 shrink-0" style={{ color: C.violet }} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  )
}

export function TemplateDetailPage({
  template,
  detail,
  siblings,
}: {
  template: Template
  detail: TemplateDetail
  siblings: Template[]
}) {
  const others = siblings.filter((t) => t.key !== template.key).slice(0, 3)

  return (
    <MarketingShell>
      <PageHero
        trail={[
          { label: "Home", href: "/" },
          { label: "Templates", href: "/templates" },
          { label: template.name },
        ]}
        eyebrow={template.tagline}
        title={template.name}
        sub={detail.standfirst}
      >
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Lozenge href={LINKS.start} primary>
            Use this template
            <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
          </Lozenge>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold"
            style={{ background: "rgba(15,16,48,0.05)", color: C.ink2 }}
          >
            <Zap className="h-3.5 w-3.5" style={{ color: C.violet }} aria-hidden="true" />
            {template.credits} credits per render
          </span>
        </div>
      </PageHero>

      <section className="px-4 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div
            className="relative aspect-[16/7] overflow-hidden rounded-[26px] border"
            style={{ borderColor: C.line, background: "rgba(124,92,255,0.07)" }}
          >
            <TemplateImage
              templateType={template.key}
              alt={`${template.name} — ${template.tagline}`}
              className="absolute inset-0 h-full w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <Block id="what" title="What it does" sub={template.description}>
        <div className="grid gap-6 sm:grid-cols-2">
          <Holo className="p-6">
            <h3 className="font-display text-[15px] font-bold tracking-tight" style={{ color: C.ink }}>
              You bring
            </h3>
            <div className="mt-4">
              <TickList items={detail.inputs} />
            </div>
          </Holo>
          <Holo className="p-6">
            <h3 className="font-display text-[15px] font-bold tracking-tight" style={{ color: C.ink }}>
              You get back
            </h3>
            <div className="mt-4">
              <TickList items={detail.outputs} />
            </div>
          </Holo>
        </div>
      </Block>

      <Block
        id="pipeline"
        title="How it works, step by step"
        sub="Everything below runs automatically once you hit go. There is no timeline to edit."
      >
        <motion.ol
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="space-y-4"
        >
          {detail.pipeline.map((step, i) => (
            <motion.li key={step.title} variants={rise}>
              <Holo className="p-6">
                <div className="flex gap-4">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.pink})` }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-[16px] font-bold tracking-tight" style={{ color: C.ink }}>
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: C.ink2 }}>
                      {step.detail}
                    </p>
                  </div>
                </div>
              </Holo>
            </motion.li>
          ))}
        </motion.ol>
      </Block>

      <Block id="best-for" title="Best for">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <TickList items={detail.bestFor} />
          </div>
          <Holo className="p-6">
            <h3 className="font-display text-[15px] font-bold tracking-tight" style={{ color: C.ink }}>
              What you can change
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {detail.settings.map((setting) => (
                <li
                  key={setting}
                  className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                  style={{ background: "rgba(15,16,48,0.05)", color: C.ink2 }}
                >
                  {setting}
                </li>
              ))}
            </ul>
          </Holo>
        </div>
      </Block>

      <Block id="faq" title="Questions about this template">
        <div className="space-y-4">
          {detail.faqs.map((faq) => (
            <Holo key={faq.q} className="p-6">
              <h3 className="font-display text-[15.5px] font-bold tracking-tight" style={{ color: C.ink }}>
                {faq.q}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.ink2 }}>
                {faq.a}
              </p>
            </Holo>
          ))}
        </div>
      </Block>

      {others.length > 0 && (
        <Block id="other" title="Other templates" wide>
          <div className="grid gap-5 sm:grid-cols-3">
            {others.map((t) => (
              <Link key={t.key} href={`/templates/${templateSlug(t.key)}`} className="block h-full">
                <Holo className="h-full p-6">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.12em]" style={{ color: C.ink3 }}>
                    {t.tagline}
                  </div>
                  <h3 className="font-display mt-1.5 text-[16px] font-bold tracking-tight" style={{ color: C.ink }}>
                    {t.name}
                  </h3>
                  <span
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold"
                    style={{ color: C.violet }}
                  >
                    Read more
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Holo>
              </Link>
            ))}
          </div>
        </Block>
      )}

      <section className="px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-3">
          <Lozenge href={LINKS.start} primary>
            Start creating free
            <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
          </Lozenge>
          <Lozenge href="/templates">All templates</Lozenge>
        </div>
      </section>
    </MarketingShell>
  )
}
