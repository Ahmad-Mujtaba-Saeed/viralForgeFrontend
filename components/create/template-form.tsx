'use client'

import { motion } from 'framer-motion'
import { Upload, FileText, Music, Images, Copy } from 'lucide-react'
import { TemplateType } from './template-selector'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface TemplateFormProps {
  templateType: TemplateType
}

export function TemplateForm({ templateType }: TemplateFormProps) {
  const [fileName, setFileName] = useState<string>('')

  const uploadVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  const renderForm = () => {
    switch (templateType) {
      case 'upload':
        return (
          <motion.div
            key="upload"
            variants={uploadVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <label className="block">
              <span className="block text-sm font-medium text-foreground mb-3">
                Video File
              </span>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors group"
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-foreground">
                  {fileName || 'Drop your video or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV up to 2GB</p>
              </motion.div>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="block text-sm font-medium text-foreground mb-2">Duration</span>
                <select className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary">
                  <option>Short (15-60s)</option>
                  <option>Medium (60-300s)</option>
                  <option>Long (300s+)</option>
                </select>
              </label>
              <label>
                <span className="block text-sm font-medium text-foreground mb-2">Style</span>
                <select className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary">
                  <option>Cinematic</option>
                  <option>Casual</option>
                  <option>Professional</option>
                  <option>Energetic</option>
                </select>
              </label>
            </div>
          </motion.div>
        )

      case 'script':
        return (
          <motion.div
            key="script"
            variants={uploadVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <label>
              <span className="block text-sm font-medium text-foreground mb-2">
                Your Script
              </span>
              <textarea
                placeholder="Write your video script here. Include descriptions for visuals..."
                className="w-full h-32 px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="block text-sm font-medium text-foreground mb-2">Tone</span>
                <select className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary">
                  <option>Professional</option>
                  <option>Casual</option>
                  <option>Funny</option>
                  <option>Educational</option>
                </select>
              </label>
              <label>
                <span className="block text-sm font-medium text-foreground mb-2">Duration</span>
                <select className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary">
                  <option>15-30 seconds</option>
                  <option>30-60 seconds</option>
                  <option>1-3 minutes</option>
                  <option>3+ minutes</option>
                </select>
              </label>
            </div>
          </motion.div>
        )

      case 'audio':
        return (
          <motion.div
            key="audio"
            variants={uploadVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <label>
              <span className="block text-sm font-medium text-foreground mb-3">
                Audio File
              </span>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors group"
              >
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Music className="w-8 h-8 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-foreground">
                  {fileName || 'Drop your audio or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A</p>
              </motion.div>
            </label>
            <label>
              <span className="block text-sm font-medium text-foreground mb-2">Visual Style</span>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary">
                <option>Abstract</option>
                <option>Music Visualizer</option>
                <option>Podcast Cover</option>
                <option>Ambient</option>
              </select>
            </label>
          </motion.div>
        )

      case 'image':
        return (
          <motion.div
            key="image"
            variants={uploadVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <label>
              <span className="block text-sm font-medium text-foreground mb-3">
                Images (Multiple)
              </span>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors group"
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    setFileName(`${e.target.files?.length || 0} images selected`)
                  }
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Images className="w-8 h-8 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-foreground">
                  {fileName || 'Drop your images or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP</p>
              </motion.div>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="block text-sm font-medium text-foreground mb-2">Transition</span>
                <select className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary">
                  <option>Smooth Fade</option>
                  <option>Zoom</option>
                  <option>Slide</option>
                  <option>3D Rotation</option>
                </select>
              </label>
              <label>
                <span className="block text-sm font-medium text-foreground mb-2">Speed</span>
                <select className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary">
                  <option>Slow</option>
                  <option>Normal</option>
                  <option>Fast</option>
                </select>
              </label>
            </div>
          </motion.div>
        )

      case 'clone':
        return (
          <motion.div
            key="clone"
            variants={uploadVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <label>
              <span className="block text-sm font-medium text-foreground mb-3">
                Reference Video URL
              </span>
              <input
                type="url"
                placeholder="Paste TikTok, YouTube, or Instagram URL"
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </label>
            <label>
              <span className="block text-sm font-medium text-foreground mb-3">
                Your Content
              </span>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors group"
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-foreground">
                  {fileName || 'Upload your video or click to browse'}
                </p>
              </motion.div>
            </label>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          {templateType === 'upload' && <Upload className="w-5 h-5" />}
          {templateType === 'script' && <FileText className="w-5 h-5" />}
          {templateType === 'audio' && <Music className="w-5 h-5" />}
          {templateType === 'image' && <Images className="w-5 h-5" />}
          {templateType === 'clone' && <Copy className="w-5 h-5" />}
          {templateType === 'upload' && 'Upload & Enhance'}
          {templateType === 'script' && 'Generate from Script'}
          {templateType === 'audio' && 'Audio to Video'}
          {templateType === 'image' && 'Image to Video'}
          {templateType === 'clone' && 'Clone Format'}
        </h3>
        {renderForm()}
      </div>
    </div>
  )
}
