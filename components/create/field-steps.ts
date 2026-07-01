/** Helpers that map a backend settings_schema into the stepped Create flow. */

const SOURCE_KEYS = new Set([
  "input_mode",
  "video_file",
  "youtube_url",
  "url",
  "link",
  "reference_url",
  "source_url",
  "video_url",
])

/** A field belongs to the "Source" step if it's a file upload or a known source key. */
export function isSourceField(key: string, schema: any): boolean {
  return schema?.type === "file" || SOURCE_KEYS.has(key)
}

/** Turn a TTS voice id (e.g. "am_michael", "bf_emma") into a friendly name + tone. */
export function voiceLabel(id: string): { name: string; tone: string } {
  if (!id) return { name: "Default", tone: "Voice" }
  const m = /^([ab])([mf])_(.+)$/.exec(id)
  if (m) {
    const accent = m[1] === "b" ? "UK" : "US"
    const gender = m[2] === "f" ? "F" : "M"
    const name = m[3].charAt(0).toUpperCase() + m[3].slice(1)
    return { name, tone: `${accent} · ${gender}` }
  }
  const name = id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  return { name, tone: "Voice" }
}

/** Prettify any schema key/label fallback. Coerces non-strings (e.g. numeric
 *  select options like 15, 20) so we never call .replace on a number. */
export function prettyLabel(key: unknown): string {
  return String(key ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** A deterministic color for a voice avatar. */
export function voiceColor(id: string): string {
  const palette = ["#E8492B", "#3B6FE0", "#1F9E6B", "#8A57D8", "#F6A14A", "#19C2C2"]
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}
