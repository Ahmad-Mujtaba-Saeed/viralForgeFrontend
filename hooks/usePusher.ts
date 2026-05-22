import { useEffect, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'

interface PusherConfig {
  key: string
  cluster: string
  useTLS?: boolean
}

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

export function usePusher(config: PusherConfig) {
  const pusherRef = useRef<Pusher | null>(null)
  const channelsRef = useRef<Map<string, any>>(new Map())

  // Initialize Pusher
  useEffect(() => {
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(config.key, {
        cluster: config.cluster,
        useTLS: config.useTLS !== false,
        encrypted: true,
      })
    }

    return () => {
      // Don't disconnect on unmount as we might want to keep the connection
      // pusherRef.current?.disconnect()
    }
  }, [config.key, config.cluster, config.useTLS])

  // Subscribe to a channel
  const subscribe = useCallback(
    (channelName: string) => {
      if (!pusherRef.current) return null

      if (!channelsRef.current.has(channelName)) {
        const channel = pusherRef.current.subscribe(channelName)
        channelsRef.current.set(channelName, channel)
      }

      return channelsRef.current.get(channelName)
    },
    []
  )

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channelName: string) => {
    if (pusherRef.current && channelsRef.current.has(channelName)) {
      pusherRef.current.unsubscribe(channelName)
      channelsRef.current.delete(channelName)
    }
  }, [])

  // Bind event listener to a channel
  const bindEvent = useCallback(
    (channelName: string, eventName: string, listener: PusherEventListener) => {
      const channel = subscribe(channelName)
      if (channel) {
        channel.bind(eventName, listener)
      }
    },
    [subscribe]
  )

  // Unbind event listener from a channel
  const unbindEvent = useCallback(
    (channelName: string, eventName: string, listener?: PusherEventListener) => {
      const channel = channelsRef.current.get(channelName)
      if (channel) {
        if (listener) {
          channel.unbind(eventName, listener)
        } else {
          channel.unbind(eventName)
        }
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
 * Hook to listen to project progress updates from Pusher
 */
export function useProjectProgress(projectId: number | string | null) {
  const pusher = usePusher({
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap2',
  })

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
