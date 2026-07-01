"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type Tier = {
  name: string
  dailyCredits: number
  monthly: number
  description: string
  features: string[]
  popular: boolean
}

const tiers: Tier[] = [
  {
    name: "Starter",
    dailyCredits: 100,
    monthly: 5,
    description: "For getting started with daily content.",
    features: [
      "100 credits per day",
      "All video templates",
      "1080p HD exports",
      "Standard render queue",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Creator",
    dailyCredits: 300,
    monthly: 10,
    description: "For creators publishing every day.",
    features: [
      "300 credits per day",
      "All video templates",
      "1080p HD exports",
      "Priority render queue",
      "Background music & captions",
      "Priority email support",
    ],
    popular: true,
  },
  {
    name: "Studio",
    dailyCredits: 1000,
    monthly: 20,
    description: "For teams and high-volume output.",
    features: [
      "1000 credits per day",
      "All video templates",
      "1080p HD exports",
      "Fastest render queue",
      "Commercial usage rights",
      "Dedicated support",
    ],
    popular: false,
  },
]

export function Pricing() {
  const [interval, setInterval] = useState<"month" | "year">("month")

  const priceFor = (t: Tier) =>
    interval === "year" ? Math.round(t.monthly * 12 * 0.75) : t.monthly

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Simple, Credit-Based
            <br />
            <span className="text-primary">Pricing</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Every plan refreshes your credits daily. Spend them on any template — pay only for what you make.
          </p>
        </motion.div>

        {/* Interval toggle */}
        <div className="mb-12 flex items-center justify-center">
          <div className="inline-flex rounded-xl border border-border bg-card p-1">
            {(["month", "year"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setInterval(opt)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  interval === opt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt === "month" ? "Monthly" : "Yearly"}
                {opt === "year" && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                    Save 25%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-primary text-primary-foreground border-2 border-primary shadow-xl shadow-primary/20"
                  : "bg-card border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-foreground text-background text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className={`text-xl font-semibold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                    ${priceFor(plan)}
                  </span>
                  <span className={plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}>
                    /{interval === "year" ? "yr" : "mo"}
                  </span>
                </div>
                <div
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold ${
                    plan.popular ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Zap className="h-4 w-4 fill-current" />
                  {plan.dailyCredits.toLocaleString()} credits / day
                </div>
                <p className={`mt-3 text-sm ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className={`h-5 w-5 flex-shrink-0 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                    <span className={`text-sm ${plan.popular ? "text-primary-foreground/90" : "text-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${
                  plan.popular
                    ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                asChild
              >
                <Link href="/dashboard/billing">Get {plan.name}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
