import Pusher, { Channel } from 'pusher-js'
import { toast } from 'sonner'

/**
 * One Pusher connection for the whole app. Every page/hook that wants
 * realtime updates goes through here instead of constructing its own
 * `new Pusher(...)` — otherwise mounting several project rows (list pages)
 * would each open a separate WebSocket.
 */
let client: Pusher | null = null
const channelRefCounts = new Map<string, number>()

// Debounce connection-error toasts — Pusher retries transiently on its own,
// so only surface a toast once per short window instead of once per retry.
let lastConnectionToastAt = 0
const CONNECTION_TOAST_COOLDOWN_MS = 15000

function notifyConnectionIssue(text: string) {
  const now = Date.now()
  if (now - lastConnectionToastAt < CONNECTION_TOAST_COOLDOWN_MS) return
  lastConnectionToastAt = now
  toast.error(text)
}

export function getPusherClient(): Pusher | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap2'
  if (!key) return null

  if (!client) {
    client = new Pusher(key, {
      cluster,
      forceTLS: true,
    })

    client.connection.bind('unavailable', () => {
      notifyConnectionIssue('Live updates are temporarily unavailable — reconnecting…')
    })

    client.connection.bind('failed', () => {
      notifyConnectionIssue('Live updates could not connect. Refresh the page if progress stops updating.')
    })
  }

  return client
}

/** Ref-counted subscribe: only the first caller for a channel actually subscribes. */
export function subscribeToChannel(channelName: string): Channel | null {
  const pusher = getPusherClient()
  if (!pusher) return null

  const count = channelRefCounts.get(channelName) ?? 0
  channelRefCounts.set(channelName, count + 1)

  const channel = pusher.channel(channelName) ?? pusher.subscribe(channelName)

  if (count === 0) {
    channel.bind('pusher:subscription_error', () => {
      notifyConnectionIssue("Couldn't get live updates for one of your projects.")
    })
  }

  return channel
}

/** Look up an already-subscribed channel without touching the ref count — for binding/unbinding listeners. */
export function getChannel(channelName: string): Channel | null {
  return getPusherClient()?.channel(channelName) ?? null
}

/** Ref-counted unsubscribe: only tears the channel down once every caller has released it. */
export function unsubscribeFromChannel(channelName: string): void {
  const pusher = getPusherClient()
  if (!pusher) return

  const count = channelRefCounts.get(channelName) ?? 0
  if (count <= 1) {
    channelRefCounts.delete(channelName)
    pusher.unsubscribe(channelName)
  } else {
    channelRefCounts.set(channelName, count - 1)
  }
}
