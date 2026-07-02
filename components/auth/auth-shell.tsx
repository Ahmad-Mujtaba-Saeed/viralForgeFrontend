"use client"

import * as React from "react"
import Link from "next/link"
import { Flame, Check, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

/** Shared input styling for all auth forms. */
export const authInputClass =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-ink3 focus:border-primary disabled:opacity-60"

export function AuthLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-foreground">
      {children}
    </label>
  )
}

export function AuthAlert({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
        kind === "success"
          ? "border-good/30 bg-good/10 text-good"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      {kind === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      )}
      <span>{children}</span>
    </div>
  )
}

export const authButtonClass =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"

const PERKS = [
  "Studio voiceover & karaoke captions on every video",
  "Fresh credits every day — cancel anytime",
  "No filming, no editing — just pick a template",
]

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Flame className="h-[18px] w-[18px] text-primary-foreground" />
            </span>
            <span className="font-display text-[19px] font-bold tracking-tight text-foreground">ViralForge</span>
          </Link>

          <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>

      {/* Right — brand panel */}
      <div className="relative hidden overflow-hidden bg-[#1A1916] lg:block">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle,rgba(232,73,43,.5),transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(#FFF 1px, transparent 1px), linear-gradient(90deg,#FFF 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative flex h-full flex-col justify-center px-14 py-16">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#FF8A5C]">
            <Flame className="h-3.5 w-3.5" />
            AI shorts studio
          </span>
          <h2 className="font-display mt-6 max-w-md text-[38px] font-extrabold leading-[1.05] tracking-tight text-white">
            Make your next video in minutes.
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/70">
            Faceless shorts, explainers, gameplay clips and more — scripted, voiced, captioned and edited by AI.
          </p>

          <ul className="mt-9 space-y-3.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[14.5px] text-white/85">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#E8492B]">
                  <Check className="h-3 w-3 text-white" />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <figure className="mt-12 max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <blockquote className="text-[14px] leading-relaxed text-white/85">
              “Script to upload in one sitting. It’s the only reason I can post to all three of my channels daily.”
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FCEDE8] text-[11px] font-bold text-[#E8492B]">
                MO
              </span>
              <span className="text-[12.5px] text-white/60">Maya Ortiz · Faceless creator</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  )
}
