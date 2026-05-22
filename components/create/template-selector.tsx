'use client'

import { motion } from 'framer-motion'
import { Upload, FileText, Music, Images, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export type TemplateType = 'upload' | 'script' | 'audio' | 'image' | 'clone'

interface Template {
  id: TemplateType
  name: string
  description: string
  icon: React.ReactNode
}

const templates: Template[] = [
  {
    id: 'upload',
    name: 'Upload Video',
    description: 'Upload your video and let AI enhance it',
    icon: <Upload className="w-5 h-5" />,
  },
  {
    id: 'script',
    name: 'From Script',
    description: 'Write a script and generate video',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'audio',
    name: 'From Audio',
    description: 'Upload audio and create visuals',
    icon: <Music className="w-5 h-5" />,
  },
  {
    id: 'image',
    name: 'Image to Video',
    description: 'Transform images into videos',
    icon: <Images className="w-5 h-5" />,
  },
  {
    id: 'clone',
    name: 'Clone Format',
    description: 'Recreate viral video formats',
    icon: <Copy className="w-5 h-5" />,
  },
]

interface TemplateSelectorProps {
  selectedTemplate: TemplateType
  onSelectTemplate: (template: TemplateType) => void
}

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Check className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Select Template</h3>
      </div>

      <div className="space-y-2">
        {templates.map((template) => (
          <motion.button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left group ${
              selectedTemplate === template.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 transition-colors ${
                  selectedTemplate === template.id
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-primary'
                }`}
              >
                {template.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{template.name}</p>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
              {selectedTemplate === template.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-primary flex items-center justify-center mt-1"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
