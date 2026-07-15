'use client'

import * as React from 'react'
import { DEFAULT_SKIN, SKIN_STORAGE_KEY, isSkin, type Skin } from '@/lib/skins'

type SkinContextValue = {
  skin: Skin
  setSkin: (skin: Skin) => void
  /** False until mounted — read this before rendering skin-dependent UI to avoid hydration mismatch. */
  mounted: boolean
}

const SkinContext = React.createContext<SkinContextValue>({
  skin: DEFAULT_SKIN,
  setSkin: () => {},
  mounted: false,
})

export const useSkin = () => React.useContext(SkinContext)

/**
 * Owns the `data-theme` attribute on <html>.
 *
 * The attribute is already correct before React boots (server stamps the admin
 * default, the inline script in <head> applies any stored user choice), so this
 * provider just reads it back and takes over from there — it never causes a flash.
 */
export function SkinProvider({
  defaultSkin = DEFAULT_SKIN,
  children,
}: {
  defaultSkin?: Skin
  children: React.ReactNode
}) {
  const [skin, setSkinState] = React.useState<Skin>(defaultSkin)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const fromDom = document.documentElement.getAttribute('data-theme')
    if (isSkin(fromDom)) setSkinState(fromDom)
    setMounted(true)
  }, [])

  const setSkin = React.useCallback((next: Skin) => {
    setSkinState(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, next)
    } catch {
      // Private-mode / storage-disabled: the skin still applies for this session.
    }
  }, [])

  const value = React.useMemo(() => ({ skin, setSkin, mounted }), [skin, setSkin, mounted])

  return (
    <SkinContext.Provider value={value}>
      {children}
      <AmbientBackdrop active={skin === 'aurora' || skin === 'prism'} />
    </SkinContext.Provider>
  )
}

/**
 * The light field the glass refracts, shared by every glass skin (Aurora,
 * Liquid Glass). Fixed behind all content (z-index -1), so it costs nothing in
 * layout and every translucent surface in the app picks it up automatically.
 * The `.aurora-*` utilities read the active skin's CSS tokens, so this same
 * markup renders a deep violet aurora or a pale pastel prism as appropriate.
 */
function AmbientBackdrop({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <>
      <div className="aurora-field" aria-hidden="true">
        <div className="aurora-orb" />
      </div>
      <div className="aurora-grain" aria-hidden="true" />
    </>
  )
}
