import { Suspense } from 'react'
import { StoryboardPageClient } from './StoryboardPageClient'

export default function ExplainerEditorPage() {
  return (
    <Suspense>
      <StoryboardPageClient />
    </Suspense>
  )
}
