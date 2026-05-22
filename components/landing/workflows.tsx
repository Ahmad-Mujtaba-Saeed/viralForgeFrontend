"use client"

import { motion } from "framer-motion"
import { Video, Mic, ImageIcon, Share2, Wand2, BarChart3 } from "lucide-react"

const workflows = [
  {
    icon: Wand2,
    title: "AI Script Writing",
    description: "Generate engaging scripts with AI that understands your brand voice and audience.",
  },
  {
    icon: Video,
    title: "Auto Video Editing",
    description: "Automatically edit your footage with smart cuts, transitions, and effects.",
  },
  {
    icon: Mic,
    title: "Voice Synthesis",
    description: "Create natural-sounding voiceovers in multiple languages and styles.",
  },
  {
    icon: ImageIcon,
    title: "Visual Generation",
    description: "Generate stunning visuals and thumbnails that capture attention.",
  },
  {
    icon: Share2,
    title: "Multi-Platform Publishing",
    description: "Schedule and publish to YouTube, TikTok, Instagram, and more.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track performance metrics and optimize your content strategy.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export function Workflows() {
  return (
    <section id="workflows" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Powerful Workflows for
            <br />
            <span className="text-primary">Content Creators</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Everything you need to create, edit, and distribute viral video content at scale.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {workflows.map((workflow, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <workflow.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {workflow.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {workflow.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
