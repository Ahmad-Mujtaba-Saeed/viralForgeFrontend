'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Sparkles, Zap, Palette } from 'lucide-react'

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.5', 'end 0.5'],
  })
  
  const steps = [
    {
      number: '01',
      title: 'Upload Your Content',
      description: 'Share your raw video clips, images, and audio files. Our AI analyzes and prepares everything for transformation.',
      icon: Sparkles,
      details: ['Support all formats', 'Instant processing', 'Auto-enhancement'],
    },
    {
      number: '02',
      title: 'AI-Powered Creation',
      description: 'Let ViralForge&apos;s AI work its magic. Automatic editing, effects, transitions, and optimization for maximum engagement.',
      icon: Zap,
      details: ['Smart editing', 'Dynamic effects', 'Auto-sync audio'],
    },
    {
      number: '03',
      title: 'Publish & Succeed',
      description: 'One-click publishing across all platforms. Track performance and refine your content strategy in real-time.',
      icon: Palette,
      details: ['Multi-platform', 'Analytics', 'A/B testing'],
    },
  ]

  return (
    <section ref={containerRef} id="how-it-works" className="relative py-24 bg-gradient-to-b from-background via-background to-muted/20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: false }}
          className="max-w-2xl mx-auto text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Simple Process</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Professional videos
            </span>
            {' '}in three simple steps
          </h2>
          <p className="text-lg text-muted-foreground">
            Our intuitive workflow lets you create studio-quality content in minutes, not hours
          </p>
        </motion.div>

        {/* Steps Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20 relative">
          {/* Animated line - Desktop only */}
          <div className="hidden md:block absolute top-32 left-0 right-0 h-1 bg-border/30 rounded-full">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary to-primary/30 rounded-full"
              style={{
                scaleX: scrollYProgress,
                transformOrigin: 'left',
              }}
            />
          </div>

          {/* Steps */}
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: false }}
                className="relative"
              >
                {/* Step Card */}
                <div className="relative bg-card/50 border border-border/50 rounded-2xl p-8 h-full backdrop-blur-sm hover:border-primary/30 hover:bg-card/70 transition-all duration-300 group">
                  {/* Number Circle */}
                  <motion.div
                    className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    whileInView={{
                      scale: [0.8, 1.1, 1],
                    }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: false }}
                  >
                    {step.number}
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 mt-2 group-hover:bg-primary/20 transition-colors duration-300"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <Icon className="w-7 h-7 text-primary" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">{step.description}</p>

                  {/* Details List */}
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        {detail}
                      </li>
                    ))}
                  </ul>

                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                {/* Mobile connector line */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center my-6">
                    <motion.div
                      className="w-1 h-8 bg-gradient-to-b from-primary to-primary/30"
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      transition={{ duration: 0.5 }}
                      viewport={{ once: false }}
                    />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: false }}
          className="text-center"
        >
          <button className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95">
            Start Creating Free
          </button>
        </motion.div>
      </div>

      {/* Background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
    </section>
  )
}
