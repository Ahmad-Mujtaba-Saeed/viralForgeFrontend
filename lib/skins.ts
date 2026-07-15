/**
 * "Skins" are the site's colour schemes. They sit on a separate axis from
 * light/dark (which next-themes owns via the `.dark` class): a skin is
 * selected with `data-theme` on <html>, and each skin defines BOTH a light
 * and a dark palette in globals.css. So skin × mode = 4 combinations.
 */

export const SKINS = ['editorial', 'aurora', 'prism'] as const
export type Skin = (typeof SKINS)[number]

export const DEFAULT_SKIN: Skin = 'editorial'

/** localStorage key holding the visitor's own choice, which beats the admin default. */
export const SKIN_STORAGE_KEY = 'vf-skin'

export const SKIN_META: Record<
  Skin,
  { label: string; desc: string; swatch: string[] }
> = {
  editorial: {
    label: 'Warm Editorial',
    desc: 'Cream paper, bold display type, a confident orange accent. Calm and print-like.',
    swatch: ['#FBFAF8', '#1A1916', '#E8492B'],
  },
  aurora: {
    label: 'Aurora Glass',
    desc: 'Frosted glass floating over a drifting violet–cyan aurora. Deep, luminous, modern.',
    swatch: ['#08071A', '#7C5CFF', '#22D3EE'],
  },
  prism: {
    label: 'Liquid Glass',
    desc: 'Bright frosted glass over a soft pastel prism, with iridescent blue–pink–lilac light. Airy and premium.',
    swatch: ['#EAEEF9', '#5B8CFF', '#FF6FCF'],
  },
}

export function isSkin(value: unknown): value is Skin {
  return typeof value === 'string' && (SKINS as readonly string[]).includes(value)
}

/**
 * Runs before first paint (injected into <head>) so the correct skin is on
 * <html> by the time anything renders — otherwise a user on Aurora would see
 * a flash of the cream editorial theme on every page load.
 *
 * The server already stamped the admin default onto <html data-theme>; this
 * only *overrides* it when the visitor has made their own choice.
 */
export const SKIN_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${SKIN_STORAGE_KEY}');
    var allowed = ${JSON.stringify(SKINS)};
    if (stored && allowed.indexOf(stored) !== -1) {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`.trim()
