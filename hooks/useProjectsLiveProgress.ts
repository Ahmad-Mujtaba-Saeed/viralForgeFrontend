import { useEffect, useRef } from 'react'
import { subscribeToChannel, unsubscribeFromChannel, getChannel } from '@/lib/pusherClient'
import { useAppDispatch } from '@/hooks/useAuth'
import { updateProjectInList } from '@/store/projectSlice'

type Handlers = {
  progress: (data: any) => void
  status: (data: any) => void
  completed: (data: any) => void
  error: (data: any) => void
}

const bindAll = (channel: NonNullable<ReturnType<typeof subscribeToChannel>>, handlers: Handlers) => {
  channel.bind('project.progress', handlers.progress)
  channel.bind('project.status', handlers.status)
  channel.bind('project.completed', handlers.completed)
  channel.bind('project.error', handlers.error)
}

const unbindAll = (channel: ReturnType<typeof getChannel>, handlers: Handlers) => {
  channel?.unbind('project.progress', handlers.progress)
  channel?.unbind('project.status', handlers.status)
  channel?.unbind('project.completed', handlers.completed)
  channel?.unbind('project.error', handlers.error)
}

/**
 * Subscribes to live Pusher progress for a set of in-progress project ids,
 * patching each one straight into the Redux `projects` list as updates
 * arrive — no polling. Pass only the ids that are currently processing;
 * this hook diffs additions/removals against what it already holds and
 * subscribes/unsubscribes accordingly (ref-counted at the Pusher client
 * level so other mounted pages/hooks sharing a channel aren't affected).
 */
export function useProjectsLiveProgress(processingIds: Array<number | string>) {
  const dispatch = useAppDispatch()
  const subscriptionsRef = useRef<Map<string, Handlers>>(new Map())
  const idsKey = Array.from(new Set(processingIds.map(String))).sort().join(',')

  useEffect(() => {
    const idsSet = new Set(idsKey ? idsKey.split(',') : [])
    const subs = subscriptionsRef.current

    idsSet.forEach((idStr) => {
      if (subs.has(idStr)) return
      const channelName = `project.${idStr}`
      const channel = subscribeToChannel(channelName)
      if (!channel) return

      const handlers: Handlers = {
        progress: (data) =>
          dispatch(updateProjectInList({ id: idStr, progress: data?.progress, status: 'processing' })),
        status: (data) => dispatch(updateProjectInList({ id: idStr, status: data?.status })),
        completed: () => dispatch(updateProjectInList({ id: idStr, status: 'completed', progress: 100 })),
        error: () => dispatch(updateProjectInList({ id: idStr, status: 'failed' })),
      }

      bindAll(channel, handlers)
      subs.set(idStr, handlers)
    })

    Array.from(subs.keys()).forEach((idStr) => {
      if (idsSet.has(idStr)) return
      const channelName = `project.${idStr}`
      const handlers = subs.get(idStr)
      if (handlers) unbindAll(getChannel(channelName), handlers)
      unsubscribeFromChannel(channelName)
      subs.delete(idStr)
    })
  }, [idsKey, dispatch])

  // Release every subscription this hook instance holds on unmount.
  useEffect(() => {
    const subs = subscriptionsRef.current
    return () => {
      subs.forEach((handlers, idStr) => {
        const channelName = `project.${idStr}`
        unbindAll(getChannel(channelName), handlers)
        unsubscribeFromChannel(channelName)
      })
      subs.clear()
    }
  }, [])
}
