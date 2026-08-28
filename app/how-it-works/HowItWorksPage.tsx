"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { C, Holo, Lozenge, rise, stagger } from "@/components/landing/variants/liquidglass"
import { MarketingShell, PageHero, Block, Prose } from "@/components/marketing/marketing-shell"
import {
  STEPS,
  FEATURES,
  LINKS,
  templateSlug,
  type Template,
} from "@/components/landing/shared/content"

/** What actually happens between "go" and the finished file. */
const UNDER_THE_HOOD = [
  {
    title: "The script is planned, not just narrated",
    body: "Before anything is drawn, the script is split into scenes and each scene is given a job — introduce, compare, work through, conclude. That plan is what stops an AI video from being a wall of stock footage with a voice over it.",
  },
  {
    title: "Layouts are cast to content",
    body: "Each scene is matched to the card that suits it: a chart for a trend, a labelled diagram for parts of a thing, a step board for a worked problem, a countdown for a ranking. A scene never gets a layout its content cannot fill.",
  },
  {
    title: "Narration drives the timing",
    body: "The voiceover is recorded first and its word-level timings drive everything visual — text appears as it is spoken, steps reveal on the beat, and the music ducks under the voice and swells in the gaps.",
  },
  {
    title: "The mix is mastered",
    body: "Voiceover, music and sound effects are balanced and the finished file is normalised to −14 LUFS, the level the social platforms expect, so your video is not quieter than everything around it.",
  },
  {
    title: "Nothing needs a timeline",
    body: "There is no editor to learn. The only thing you review is a storyboard in plain language — and on the explainer template you can rewrite any of it before rendering.",
  },
]

export function HowItWorksPage({ templates }: { templates: Template[] }) {
  return (
    <MarketingShell>
      <PageHero
        trail={[{ label: "Home", href: "/" }, { label: "How it works" }]}
        eyebrow="How it works"
        title="Three steps."
        accent="No timeline."
        sub="You bring the idea. Scripting, voiceover, visuals, captions, music and the edit are all downstream of it, and all automatic."
      />

      <Block id="steps" title="The whole process">
        <motion.ol
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="space-y-4"
        >
          {STEPS.map((step, i) => (
            <motion.li key={step.n} variants={rise} id={`step-${i + 1}`}>
              <Holo className="p-7">
                <div className="flex gap-5">
                  <span
                    className="font-display text-[30px] font-extrabold leading-none"
                    style={{ color: C.ink3 }}
                    aria-hidden="true"
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-display text-[18px] font-bold tracking-tight" style={{ color: C.ink }}>
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: C.ink2 }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </Holo>
            </motion.li>
          ))}
        </motion.ol>
      </Block>

      <Block
        id="under-the-hood"
        title="What happens in between"
        sub="The part that decides whether an AI video is watchable."
      >
        <div className="space-y-6">
          {UNDER_THE_HOOD.map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-[16px] font-bold tracking-tight" style={{ color: C.ink }}>
                {item.title}
              </h3>
              <Prose>
                <p className="mt-2">{item.body}</p>
              </Prose>
            </div>
          ))}
        </div>
      </Block>

      <Block id="included" title="Included on every template" wide>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <Holo key={feature.title} className="p-6">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${C.line}`, color: C.violet }}
                  aria-hidden="true"
                >
                  <Icon className="h-[21px] w-[21px]" />
                </span>
                <h3 className="font-display mt-5 text-[16px] font-bold tracking-tight" style={{ color: C.ink }}>
                  {feature.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>
                  {feature.description}
                </p>
              </Holo>
            )
          })}
        </div>
      </Block>

      <Block id="pick" title="Start with the right template" sub="Pick by what you already have." wide>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Link key={t.key} href={`/templates/${templateSlug(t.key)}`}>
              <Holo className="h-full p-5">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.12em]" style={{ color: C.ink3 }}>
                  {t.tagline}
                </div>
                <h3 className="font-display mt-1.5 text-[15.5px] font-bold tracking-tight" style={{ color: C.ink }}>
                  {t.name}
                </h3>
              </Holo>
            </Link>
          ))}
        </div>
      </Block>

      <section className="px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-3">
          <Lozenge href={LINKS.start} primary>
            Start creating free
            <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
          </Lozenge>
          <Lozenge href="/pricing">See pricing</Lozenge>
        </div>
      </section>
    </MarketingShell>
  )
}
