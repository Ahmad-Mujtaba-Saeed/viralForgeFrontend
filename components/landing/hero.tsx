"use client"

import { motion } from "framer-motion"
import { ArrowRight, Play, Sparkles, Zap, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const floatingIcons = [
  { icon: Sparkles, delay: 0, x: "10%", y: "20%" },
  { icon: Zap, delay: 0.2, x: "85%", y: "15%" },
  { icon: TrendingUp, delay: 0.4, x: "75%", y: "70%" },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 0.9, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      {/* Floating Icons with Enhanced Animation */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: item.delay + 0.5, duration: 0.5 }}
          className="absolute hidden lg:block"
          style={{ left: item.x, top: item.y }}
        >
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4 + index, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
            className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-lg hover:shadow-xl hover:border-primary/50 transition-all"
          >
            <item.icon className="h-6 w-6 text-primary" />
          </motion.div>
        </motion.div>
      ))}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 hover:border-primary/40 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">AI-Powered Content Creation</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground text-balance leading-tight"
          >
            Create Viral
            <br />
            <motion.span 
              className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent"
              animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Videos in Minutes
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed"
          >
            Transform your ideas into engaging video content with AI-powered automation.
            Write scripts, generate visuals, and publish across platforms seamlessly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8 text-base h-14 rounded-full font-semibold group" asChild>
              <Link href="/dashboard">
                Start Creating Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 text-base h-14 rounded-full font-semibold hover:bg-primary/5">
              <Play className="h-5 w-5" />
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2 hover:text-foreground transition-colors">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-green-500"
              />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 hover:text-foreground transition-colors">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                className="h-2 w-2 rounded-full bg-green-500"
              />
              <span>Free tier available</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Preview with Enhanced Animation */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Animated glow background */}
            <motion.div 
              animate={{ 
                boxShadow: [
                  '0 0 60px rgba(var(--primary-rgb), 0.2)',
                  '0 0 80px rgba(var(--primary-rgb), 0.35)',
                  '0 0 60px rgba(var(--primary-rgb), 0.2)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl"
            />
            <div className="relative rounded-3xl border border-border/50 bg-card/40 backdrop-blur-md p-2 shadow-2xl overflow-hidden hover:border-primary/30 transition-colors">
              <div className="rounded-2xl bg-gradient-to-b from-muted/50 to-muted/20 aspect-video flex items-center justify-center group cursor-pointer">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="text-center"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-6 group-hover:bg-primary/30 transition-colors"
                  >
                    <Play className="h-10 w-10 text-primary ml-1 fill-primary" />
                  </motion.div>
                  <p className="text-muted-foreground text-lg">Dashboard Preview</p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
