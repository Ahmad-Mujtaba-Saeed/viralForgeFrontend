'use client'

import { useRouter } from 'next/navigation'
import { Loader2, FolderKanban } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ProcessingStartedDialog({
  open,
  onOpenChange,
  templateName,
  creditsCharged,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateName?: string
  creditsCharged?: number
}) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        // The panel is portalled to document.body, so a background set on a
        // wrapper around <Dialog> never reaches it — it has to live here.
        // The foreground tokens are re-pointed alongside it: the dark themes
        // set --foreground to near-white, which would leave this dialog's own
        // title and body text invisible against a light aliceblue panel.
        style={{
          background: 'aliceblue',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          '--foreground': '#16142E',
          '--muted-foreground': '#625C8A',
        } as React.CSSProperties}
      >
        <DialogHeader>
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <DialogTitle className="text-center">Your video is processing</DialogTitle>
          <DialogDescription className="text-center">
            {templateName ? `“${templateName}” is` : 'Your video is'} rendering now — this usually takes a
            few minutes.
            {typeof creditsCharged === 'number' && creditsCharged > 0
              ? ` ${creditsCharged} credit${creditsCharged === 1 ? '' : 's'} charged.`
              : ''}{' '}
            We&apos;ll keep you updated live.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-inset"
          >
            Stay on this page
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              router.push('/dashboard/projects')
            }}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:opacity-90"
          >
            <FolderKanban className="h-4 w-4" />
            Go to Projects
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
