import { useEffect, useRef, useCallback } from 'react'
import { subscribeToChannel, unsubscribeFromChannel, getChannel } from '@/lib/pusherClient'

interface ProgressUpdate {
  progress: number
  message?: string
  timestamp: string
}

interface StatusUpdate {
  status: string
  message?: string
  timestamp: string
}

interface StepProgressUpdate {
  step: string
  step_number: number
  total_steps: number
  step_progress: number
  overall_progress: number
  timestamp: string
}

interface CompletionUpdate {
  status: string
  result: Record<string, any>
  timestamp: string
}

interface ErrorUpdate {
  error: string
  timestamp: string
}

export type PusherEventListener = (data: any) => void

/**
 * Thin wrapper around the shared Pusher singleton (lib/pusherClient.ts).
 * Subscriptions are ref-counted there, so multiple hook instances (e.g. a
 * list page tracking several in-progress projects) can safely share one
 * WebSocket connection.
 */
export function usePusher() {
  const subscribedChannelsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const subscribed = subscribedChannelsRef.current
    return () => {
      subscribed.forEach((channelName) => unsubscribeFromChannel(channelName))
      subscribed.clear()
    }
  }, [])

  const subscribe = useCallback((channelName: string) => {
    const channel = subscribeToChannel(channelName)
    if (channel) subscribedChannelsRef.current.add(channelName)
    return channel
  }, [])

  const unsubscribe = useCallback((channelName: string) => {
    if (subscribedChannelsRef.current.has(channelName)) {
      unsubscribeFromChannel(channelName)
      subscribedChannelsRef.current.delete(channelName)
    }
  }, [])

  const bindEvent = useCallback(
    (channelName: string, eventName: string, listener: PusherEventListener) => {
      const channel = subscribe(channelName)
      channel?.bind(eventName, listener)
    },
    [subscribe]
  )

  const unbindEvent = useCallback(
    (channelName: string, eventName: string, listener?: PusherEventListener) => {
      const channel = getChannel(channelName)
      if (listener) {
        channel?.unbind(eventName, listener)
      } else {
        channel?.unbind(eventName)
      }
    },
    []
  )

  return {
    subscribe,
    unsubscribe,
    bindEvent,
    unbindEvent,
  }
}

/**
 * Hook to listen to project progress updates from Pusher.
 */
export function useProjectProgress(projectId: number | string | null) {
  const pusher = usePusher()

  const onProgress = useCallback((listener: (data: ProgressUpdate) => void) => {
    if (!projectId) return

    const channelName = `project.${projectId}`
    pusher.bindEvent(channelName, 'project.progress', listener)

    return () => {
      pusher.unbindEvent(channelName, 'project.progress', listener)
    }
  }, [projectId, pusher])

  const onStatus = useCallback((listener: (data: StatusUpdate) => void) => {
    if (!projectId) return

    const channelName = `project.${projectId}`
    pusher.bindEvent(channelName, 'project.status', listener)

    return () => {
      pusher.unbindEvent(channelName, 'project.status', listener)
    }
  }, [projectId, pusher])

  const onStepProgress = useCallback((listener: (data: StepProgressUpdate) => void) => {
    if (!projectId) return

    const channelName = `project.${projectId}`
    pusher.bindEvent(channelName, 'project.step_progress', listener)

    return () => {
      pusher.unbindEvent(channelName, 'project.step_progress', listener)
    }
  }, [projectId, pusher])

  const onCompletion = useCallback((listener: (data: CompletionUpdate) => void) => {
    if (!projectId) return

    const channelName = `project.${projectId}`
    pusher.bindEvent(channelName, 'project.completed', listener)

    return () => {
      pusher.unbindEvent(channelName, 'project.completed', listener)
    }
  }, [projectId, pusher])

  const onError = useCallback((listener: (data: ErrorUpdate) => void) => {
    if (!projectId) return

    const channelName = `project.${projectId}`
    pusher.bindEvent(channelName, 'project.error', listener)

    return () => {
      pusher.unbindEvent(channelName, 'project.error', listener)
    }
  }, [projectId, pusher])

  return {
    onProgress,
    onStatus,
    onStepProgress,
    onCompletion,
    onError,
  }
}
