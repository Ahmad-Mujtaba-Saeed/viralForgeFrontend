'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, Wand2, Check, FileVideo } from 'lucide-react'
import { useState, useEffect } from 'react'

type ProcessingStep = 'idle' | 'uploading' | 'processing' | 'creating' | 'finalizing' | 'complete'

interface VideoPreviewProps {
  status?: string
  progress?: number
  isUploading?: boolean
  isUploadingDone?: boolean
  selectedFilePreview?: string | null
  outputVideoUrl?: string | null
}

const steps: { id: ProcessingStep; label: string; icon: React.ReactNode }[] = [
  { id: 'uploading', label: 'Uploading', icon: <FileVideo className="w-5 h-5" /> },
  { id: 'processing', label: 'Processing', icon: <Zap className="w-5 h-5" /> },
  { id: 'creating', label: 'Creating', icon: <Wand2 className="w-5 h-5" /> },
  { id: 'finalizing', label: 'Finalizing', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'complete', label: 'Complete', icon: <Check className="w-5 h-5" /> },
]

const stepOrder: ProcessingStep[] = ['uploading', 'processing', 'creating', 'finalizing', 'complete']

const getStepFromState = (
  status?: string,
  progress: number = 0,
  isUploading = false,
  isUploadingDone = false
): ProcessingStep => {
  if (isUploading) {
    return 'uploading'
  }

  if (isUploadingDone && status !== 'processing' && status !== 'completed' && status !== 'failed') {
    return 'uploading'
  }

  if (status === 'completed' || progress >= 100) {
    return 'complete'
  }

  if ( status === 'processing' && progress >= 60) {
    return 'finalizing'
  }

  if ( status === 'processing' && progress >= 25) {
    return 'creating'
  }

  if (status === 'processing' && progress >= 0) {
    return 'processing'
  }

  return 'idle'
}

export function VideoPreview({ status, progress = 0, isUploading = false , isUploadingDone = false, selectedFilePreview = null, outputVideoUrl = null }: VideoPreviewProps) {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('idle')
  const displayProgress = isUploadingDone && !isUploading ? 100 : progress

  useEffect(() => {
    setCurrentStep(getStepFromState(status, progress, isUploading, isUploadingDone))
  }, [status, progress, isUploading, isUploadingDone])

  const isActive = (step: ProcessingStep) => {
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(step)
    return stepIndex <= currentIndex
  }

  return (
    <div className="flex flex-col h-full">
      {/* Preview Area */}
      <div className="flex-1 rounded-2xl border border-border bg-gradient-to-br from-card/50 to-muted/30 backdrop-blur-sm overflow-hidden flex items-center justify-center relative mb-6">
        <AnimatePresence mode="wait">
          {/* Show output video when processing is complete */}
          {currentStep === 'complete' && outputVideoUrl ? (
            <motion.div
  key="output-video"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="w-full"
>
  <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
    <video
      src={outputVideoUrl}
      controls
      autoPlay
      className="w-full h-full object-contain"
    />
  </div>
</motion.div>
          ) : selectedFilePreview && (isUploading || isUploadingDone) && currentStep !== 'complete' ? (
            <motion.div
              key="selected-video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <video
                src={selectedFilePreview}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            </motion.div>
          ) : currentStep === 'idle' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
              >
                <FileVideo className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-muted-foreground">Start creating to preview your video</p>
            </motion.div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center flex-col gap-6 p-8"
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    animate={{
                      x: Math.sin(i) * 100,
                      y: Math.cos(i) * 100,
                      opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                      duration: 3 + i,
                      repeat: Infinity,
                    }}
                    style={{
                      width: 80 + i * 30,
                      height: 80 + i * 30,
                      left: `${10 + i * 15}%`,
                      top: `${10 + i * 15}%`,
                      background: `radial-gradient(circle, rgba(var(--primary-rgb), 0.3) 0%, transparent 70%)`,
                    }}
                  />
                ))}
              </div>

              {/* Main Content */}
              <div className="relative z-10 text-center">
                <motion.div
                  animate={{
                    scale: ((isUploadingDone && status !== 'processing' && status !== 'completed' && status !== 'failed') && !isUploading) ? 1 : [1, 1.2, 1],
                    rotate: ((isUploadingDone && status !== 'processing' && status !== 'completed' && status !== 'failed') && !isUploading) ? 0 : [0, 5, -5, 0],
                  }}
                  transition={{ duration: 1.5, repeat: ((isUploadingDone && status !== 'processing' && status !== 'completed' && status !== 'failed') && !isUploading) ? 0 : Infinity }}
                  className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4"
                >
                  <motion.div className="text-primary text-4xl">
                    {currentStep === 'uploading' && <FileVideo className="w-10 h-10" />}
                    {currentStep === 'processing' && <Zap className="w-10 h-10" />}
                    {currentStep === 'creating' && <Wand2 className="w-10 h-10" />}
                    {currentStep === 'finalizing' && <Sparkles className="w-10 h-10" />}
                    {currentStep === 'complete' && <Check className="w-10 h-10" />}
                  </motion.div>
                </motion.div>

                <motion.p
                  key={`label-${currentStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-2xl font-semibold text-foreground mb-2"
                >
                 {(isUploadingDone && status !== 'processing' && status !== 'completed' && status !== 'failed') && !isUploading ? "Uploaded" : steps.find((s) => s.id === currentStep)?.label}
                </motion.p>

                {/* Progress Messages */}
                <AnimatePresence mode="wait">
                  {currentStep === 'uploading' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      {isUploadingDone && !isUploading  ? 'Upload successful!' : isUploading ? 'Transferring your file to our servers...' : 'Ready to process'}
                    </motion.p>
                  )}
                  {currentStep === 'processing' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      Analyzing content and preparing assets...
                    </motion.p>
                  )}
                  {currentStep === 'creating' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      Generating video with AI magic...
                    </motion.p>
                  )}
                  {currentStep === 'finalizing' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      Adding final touches and optimizing...
                    </motion.p>
                  )}
                  {currentStep === 'complete' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      Your video is ready!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Loading Bar */}
              <div className="space-y-2 mt-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{isUploadingDone && !isUploading ? 'Uploaded' : isUploading ? 'Uploading...' : 'Waiting'}</span>
                  <span>{isUploadingDone && !isUploading ? '100%' : displayProgress ? `${Math.min(displayProgress, 100)}%` : '0%'}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-primary to-primary/60 transition-all duration-500"
                    style={{ width: `${Math.min(displayProgress, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Processing Steps</h4>
          {/* <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {autoPlay ? 'Pause' : 'Resume'}
          </button> */}
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive(step.id)
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-muted/50 border border-border'
              }`}
              animate={{
                scale: currentStep === step.id ? 1.02 : 1,
              }}
            >
              <motion.div
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  isActive(step.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
                animate={{
                  rotate: (isUploadingDone && !isUploading && step.id === 'uploading') ? 0 : (currentStep === step.id ? [0, 360] : 0),
                }}
                transition={{ duration: 2, repeat: (isUploadingDone && !isUploading && step.id === 'uploading') ? 0 : (currentStep === step.id ? Infinity : 0) }}
              >
                {step.icon}
              </motion.div>
              <span
                className={`text-sm font-medium transition-colors ${
                  isActive(step.id) ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
              {(isUploadingDone && !isUploading && step.id === 'uploading') ? 'Uploaded' : step.label}
              </span>
              {step.id !== 'uploading' && index !== steps.length - 1 && (
                <motion.div
                  className={`ml-auto w-1.5 h-1.5 rounded-full transition-colors ${
                    isActive(step.id) ? 'bg-primary' : 'bg-border'
                  }`}
                  animate={{
                    scale: isUploadingDone && !isUploading ? 1 : (isActive(step.id) ? [1, 1.5, 1] : 1),
                  }}
                  transition={{ duration: 1.5, repeat: isUploadingDone && !isUploading ? 0 : (isActive(step.id) ? Infinity : 0) }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
