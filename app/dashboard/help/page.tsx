'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LifeBuoy,
  Mail,
  CreditCard,
  Video,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const SUPPORT_EMAIL = 'support@viralforge.app'

const faqs = [
  {
    q: 'How do credits work?',
    a: 'Every render costs a set number of credits depending on the template. Credits refill daily to your plan’s allotment and do not roll over. You need an active subscription to generate videos.',
  },
  {
    q: 'Why does my video need a subscription?',
    a: 'Generating a video uses AI image, voice and rendering resources. An active subscription unlocks your daily credits, which are then spent per render. You can subscribe or change plans from the Billing & Credits page.',
  },
  {
    q: 'What happens if a render fails?',
    a: 'If a render fails, the credits charged for it are automatically refunded to your balance. You can retry the render from the create screen without being charged twice.',
  },
  {
    q: 'Can I pick how my captions look?',
    a: 'Yes. In the Style & voice step you can choose a caption style — Modern Karaoke, Classic Block, or Minimal Clean. The live preview on the right reflects the style you select.',
  },
  {
    q: 'How long does a video take to generate?',
    a: 'Most short-form videos finish within a couple of minutes. You can watch live progress on the right side of the create screen; you’ll also get a completion update when it’s done.',
  },
  {
    q: 'How do I change my password or account details?',
    a: 'Open Settings from the sidebar or your profile menu. There you can update your name, email and phone, and change your password using your current one.',
  },
]

const quickLinks = [
  { icon: Sparkles, label: 'Create a video', href: '/dashboard/templates', desc: 'Browse templates and start a new project.' },
  { icon: Video, label: 'My videos', href: '/dashboard/videos', desc: 'View and manage your generated videos.' },
  { icon: CreditCard, label: 'Billing & credits', href: '/dashboard/billing', desc: 'Manage your plan and check credits.' },
]

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-foreground">Help &amp; Support</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Answers to common questions and ways to reach us.</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {quickLinks.map((l, i) => (
          <motion.div
            key={l.href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              href={l.href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-primary/40"
            >
              <l.icon className="mb-3 h-5 w-5 text-accent" />
              <span className="text-sm font-semibold text-foreground">{l.label}</span>
              <span className="mt-1 text-xs leading-relaxed text-muted-foreground">{l.desc}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* FAQ */}
      <section className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2.5">
          <BookOpen className="h-5 w-5 text-accent" />
          <h2 className="text-[16px] font-semibold text-foreground">Frequently asked questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2.5">
          <Mail className="h-5 w-5 text-accent" />
          <h2 className="text-[16px] font-semibold text-foreground">Still need help?</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Can’t find what you’re looking for? Our team is happy to help. Reach out and we’ll get back to you as
          soon as we can.
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft"
        >
          Contact support
          <ArrowRight className="h-4 w-4" />
        </a>
        <p className="mt-3 text-xs text-ink3">
          Or email us directly at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-accent">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </div>
  )
}
