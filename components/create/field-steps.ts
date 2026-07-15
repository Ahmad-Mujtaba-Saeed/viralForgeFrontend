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

/** OpenAI gpt-4o-mini-tts voices (active when the admin switches the TTS engine). */
const OPENAI_VOICES: Record<string, string> = {
  alloy: "Neutral · Balanced",
  echo: "Clear · Professional",
  fable: "Expressive · Narrative",
  onyx: "Deep · Authoritative",
  nova: "Young · Upbeat",
  shimmer: "Soft · Gentle",
  ash: "Warm · Conversational",
  ballad: "Smooth · Storytelling",
  coral: "Friendly · Energetic",
  sage: "Calm · Mature",
}

/** Turn a TTS voice id (e.g. "am_michael", "fable") into a friendly name + tone. */
export function voiceLabel(id: string): { name: string; tone: string } {
  if (!id) return { name: "Default", tone: "Voice" }
  const m = /^([ab])([mf])_(.+)$/.exec(id)
  if (m) {
    const accent = m[1] === "b" ? "UK" : "US"
    const gender = m[2] === "f" ? "F" : "M"
    const name = m[3].charAt(0).toUpperCase() + m[3].slice(1)
    return { name, tone: `${accent} · ${gender}` }
  }
  if (OPENAI_VOICES[id]) {
    return { name: id.charAt(0).toUpperCase() + id.slice(1), tone: OPENAI_VOICES[id] }
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
  const palette = ["#7C5CFF", "#5B8CFF", "#3FE0C0", "#A98CFF", "#FF6FCF", "#22D3EE"]
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}
