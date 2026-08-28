'use client'

import { Provider } from 'react-redux'
import { store } from '@/store'

interface ReduxProviderProps {
  children: React.ReactNode
}

/**
 * The app is a static export, so every page's HTML is produced at build time.
 *
 * This provider deliberately does NOT wrap the tree in redux-persist's
 * <PersistGate>. PersistGate renders its `loading` prop until rehydration
 * completes, and rehydration only ever happens in a browser — during the export
 * it never resolves, so the gate rendered `null` and EVERY page shipped with an
 * empty <body>. Crawlers (and anything without JS) saw a blank document, which
 * made the marketing page effectively invisible to search.
 *
 * Dropping the gate does not disable persistence: `persistStore` in store/index
 * still rehydrates from localStorage, it just does so a tick after first paint
 * instead of blocking it. That is safe here because nothing renders persisted
 * state directly during the first paint — `auth.user` starts null on both sides,
 * `isAuthenticated` is only read inside effects, and the landing page's
 * auth-dependent chrome is already gated behind useLandingAuth's `ready` flag.
 * So the server's markup and the client's first render still agree.
 */
export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>
}
