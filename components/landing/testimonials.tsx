"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Content Creator",
    avatar: "SC",
    content: "ViralForge has completely transformed my workflow. I can now produce a week's worth of content in just a few hours.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Marketing Director",
    avatar: "MJ",
    content: "The AI script generation is incredible. It understands our brand voice perfectly and saves us countless hours.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "YouTuber",
    avatar: "ER",
    content: "From idea to published video in under 30 minutes. This tool is a game-changer for solo creators like me.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Agency Owner",
    avatar: "DK",
    content: "We scaled our video production 10x without hiring additional editors. The ROI has been phenomenal.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Social Media Manager",
    avatar: "LT",
    content: "The multi-platform publishing feature alone is worth the subscription. Everything is automated and seamless.",
    rating: 5,
  },
  {
    name: "Alex Rivera",
    role: "Podcast Host",
    avatar: "AR",
    content: "Converting our podcast episodes into short-form video clips has never been easier. Our reach has tripled.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Loved by Creators
            <br />
            <span className="text-primary">Worldwide</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Join thousands of content creators who have transformed their workflow with ViralForge.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-6">{testimonial.content}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                  <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
