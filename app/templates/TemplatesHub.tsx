"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Zap } from "lucide-react"
import {
  C,
  Holo,
  Lozenge,
  rise,
  stagger,
} from "@/components/landing/variants/liquidglass"
import { MarketingShell, PageHero, Block } from "@/components/marketing/marketing-shell"
import { TemplateImage } from "@/components/template-image"
import { LINKS, templateSlug, type Template } from "@/components/landing/shared/content"

/**
 * The templates hub: every template as a card, plus a comparison table.
 *
 * The table is the reason this page is worth having as well as the landing's
 * templates section — "which one do I pick" is answered by seeing input, output
 * and cost side by side, which a stack of cards cannot do.
 */
export function TemplatesHub({ templates }: { templates: Template[] }) {
  return (
    <MarketingShell>
      <PageHero
        trail={[{ label: "Home", href: "/" }, { label: "Templates" }]}
        eyebrow="Templates"
        title={`${templates.length} ways to make a video,`}
        accent="one click each."
        sub="Every template is the whole job — script, voiceover, captions, music and the edit. Pick by what you have to start with: a script, a prompt, or a video."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Lozenge href={LINKS.start} primary>
            Start creating free
            <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
          </Lozenge>
          <Lozenge href="/pricing">See pricing</Lozenge>
        </div>
      </PageHero>

      <Block id="all" title="Every template" wide>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {templates.map((t) => (
            <motion.div key={t.key} variants={rise}>
              <Link href={`/templates/${templateSlug(t.key)}`} className="block h-full">
                <Holo className="h-full">
                  <article className="flex h-full flex-col">
                    <div className="relative h-[160px] overflow-hidden" style={{ background: "rgba(124,92,255,0.07)" }}>
                      <TemplateImage
                        templateType={t.key}
                        alt={`${t.name} template — ${t.tagline}`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <span
                        className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-bold backdrop-blur-md"
                        style={{ background: "rgba(255,255,255,0.82)", color: C.ink2 }}
                      >
                        <Zap className="h-3 w-3" style={{ color: C.violet }} aria-hidden="true" />
                        {t.credits}
                        <span className="sr-only">credits per render</span>
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="text-[10.5px] font-bold uppercase tracking-[0.12em]" style={{ color: C.ink3 }}>
                        {t.tagline}
                      </div>
                      <h3 className="font-display mt-1.5 text-[18px] font-bold tracking-tight" style={{ color: C.ink }}>
                        {t.name}
                      </h3>
                      <p className="mt-2 flex-1 text-[13px] leading-relaxed" style={{ color: C.ink2 }}>
                        {t.description}
                      </p>
                      <span
                        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold"
                        style={{ color: C.violet }}
                      >
                        How it works
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </article>
                </Holo>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Block>

      <Block
        id="compare"
        title="Which one should I use?"
        sub="Pick by what you already have. Credits are charged per render, and returned if a render fails."
        wide
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
            <caption className="sr-only">
              Vreato video templates compared by what they take in, what they produce, and their credit cost
            </caption>
            <thead>
              <tr style={{ color: C.ink3 }}>
                {["Template", "You bring", "You get", "Shape", "Credits"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border-b px-3 py-3 text-[11px] font-bold uppercase tracking-[0.1em]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => {
                const [bring, get] = t.tagline.split("→").map((s) => s.trim())
                return (
                  <tr key={t.key}>
                    <th scope="row" className="border-b px-3 py-3.5 font-bold" style={{ borderColor: C.lineSoft, color: C.ink }}>
                      <Link href={`/templates/${templateSlug(t.key)}`} className="hover:opacity-70">
                        {t.name}
                      </Link>
                    </th>
                    <td className="border-b px-3 py-3.5" style={{ borderColor: C.lineSoft, color: C.ink2 }}>{bring}</td>
                    <td className="border-b px-3 py-3.5" style={{ borderColor: C.lineSoft, color: C.ink2 }}>{get}</td>
                    <td className="border-b px-3 py-3.5" style={{ borderColor: C.lineSoft, color: C.ink2 }}>
                      {t.key === "ai_explainer_video" || t.key === "yt_compilation_short" ? "16:9" : "9:16"}
                    </td>
                    <td className="border-b px-3 py-3.5 font-semibold" style={{ borderColor: C.lineSoft, color: C.ink }}>{t.credits}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
