import {
  Wand2,
  Youtube,
  Gamepad2,
  Layers,
  Ghost,
  Images,
  Mic,
  Captions,
  Music,
  Image as ImageIcon,
  Smartphone,
  Zap,
  PenLine,
  Download,
  Brain,
  Sparkles,
  PlayCircle,
  Film,
  Trophy,
  type LucideIcon,
} from "lucide-react"

/**
 * Single source of truth for the marketing landing page copy.
 * Every design variant (editorial / cinematic / minimal) styles the same
 * authentic content so what we advertise always matches what the app makes.
 */

export type Template = {
  key: string
  name: string
  tagline: string
  description: string
  credits: number
  /** Icon slug, resolved via TEMPLATE_ICONS_BY_SLUG at render time — kept as a
   *  string (not a component) so this type is safe to pass from the landing
   *  page's server component down into the client variant components; React
   *  Server Components cannot serialize component/function props. */
  icon: string
  /** Public path to the template's card artwork, e.g. "/templates/foo.jpg". */
  image?: string
  badge?: string
}

/**
 * The real templates the product ships (see config/credits.php and the backend's
 * TemplateProcessorFactory). Names and descriptions are written as
 * "what you put in -> what you get out" so a first-time visitor can pick the
 * right one without reading the docs, and they match the backend copy exactly.
 */
export const TEMPLATES: Template[] = [
  {
    key: "ai_explainer_video",
    name: "AI Explainer Video",
    tagline: "Script or topic → narrated explainer",
    description:
      "Paste a script or just a topic and get a finished explainer video. The AI splits it into scenes, picks the right layout for each one — charts, diagrams, bullet slides, even a worked-out maths board — narrates it, syncs the captions and renders it in widescreen.",
    credits: 6,
    icon: "wand2",
    image: "/templates/ai-explainer-video.jpg",
    badge: "Flagship",
  },
  {
    key: "yt_automation_short",
    name: "Repurpose Video to Short",
    tagline: "Your video → tighter vertical short",
    description:
      "Turn a video you already have into a punchy vertical short. The AI transcribes it, rewrites the script tighter in the tone you choose, re-records it in a studio AI voice, keeps the frame on whoever is speaking, and burns in karaoke captions.",
    credits: 3,
    icon: "youtube",
    image: "/templates/yt-automation-short.jpg",
  },
  {
    key: "yt_gameplay_short",
    name: "Long Video to Shorts",
    tagline: "One long video → several shorts",
    description:
      "Paste one long YouTube video and get several ready-to-post vertical shorts out of it. The AI finds the strongest moments, cuts the dead air out of each one, adds karaoke captions, and can stack satisfying gameplay footage underneath.",
    credits: 2,
    icon: "gamepad2",
    image: "/templates/yt-gameplay-short.jpg",
  },
  {
    key: "yt_compilation_short",
    name: "Themed Moments Compilation",
    tagline: "2–3 videos → one countdown",
    description:
      'Give 2–3 YouTube links and a theme like "30 Disaster Moments". The AI ranks the best clips across all of them, removes the original speech so nobody talks over your voiceover, writes fresh commentary, and stitches one countdown compilation.',
    credits: 3,
    icon: "layers",
    image: "/templates/yt-compilation-short.jpg",
  },
  {
    key: "ranking_moments_short",
    name: "Top Moments Ranking",
    tagline: "One video → ranked countdown",
    description:
      "One video in, a countdown ranking short out. The AI scores every moment, ranks the winners with star ratings on a colourful rank rail, adds a bold title card, and pops the captions one word at a time.",
    credits: 3,
    icon: "trophy",
    image: "/templates/ranking-moments-short.jpg",
  },
  {
    key: "ai_image_based_shorts",
    name: "AI Story Short from a Prompt",
    tagline: "Prompt → illustrated short",
    description:
      "Type an idea and get a finished short with no footage at all. The AI writes the script, generates an image for every scene in the visual style you pick, animates the characters, narrates it, and burns in the captions.",
    credits: 5,
    icon: "images",
    image: "/templates/ai-image-based-shorts.jpg",
  },
  {
    key: "ai_horror_shorts",
    name: "AI Horror Story Short",
    tagline: "Premise → chilling story",
    description:
      "Type a premise and get a chilling narrated horror short. The AI writes the story beat by beat, generates eerie visuals in your chosen style, layers on atmosphere and effects, and burns in the captions.",
    credits: 5,
    icon: "ghost",
    image: "/templates/ai-horror-shorts.jpg",
  },
]

/**
 * Card artwork per template, keyed by template_type.
 *
 * These are AI-generated (fal.ai flux/schnell) and share one art direction, so
 * the seven cards read as a set. Keyed off the backend's template_type rather
 * than shipped by the API, so the API stays free of frontend asset paths.
 */
export const TEMPLATE_IMAGES: Record<string, string> = Object.fromEntries(
  TEMPLATES.filter((t) => t.image).map((t) => [t.key, t.image as string])
)

/** Card art for a template_type, or undefined when it is one we have no art for. */
export function templateImage(key: string): string | undefined {
  return TEMPLATE_IMAGES[key]
}

/** Maps a template icon slug (backend TemplateProcessorFactory slugs + the static list's own slugs) to a Lucide component. */
export const TEMPLATE_ICONS_BY_SLUG: Record<string, LucideIcon> = {
  brain: Brain,
  sparkles: Sparkles,
  ghost: Ghost,
  "play-circle": PlayCircle,
  film: Film,
  trophy: Trophy,
  presentation: Wand2,
  wand2: Wand2,
  youtube: Youtube,
  gamepad2: Gamepad2,
  layers: Layers,
  images: Images,
}

/** Short taglines keyed by template_type, reused when building the live (API-driven) template list. */
export const TEMPLATE_TAGLINES: Record<string, string> = Object.fromEntries(
  TEMPLATES.map((t) => [t.key, t.tagline])
)

export type PublicApiTemplate = {
  key: string
  name: string
  description: string
  icon: string
  aspect_ratio?: string
  credits: number
  badge?: string | null
}

/** Canonical display order, flagship first. The API returns templates in
 *  whatever order the factory happens to list them, and the landing page uses
 *  the FIRST entry as its large hero card — so without this the hero could end
 *  up being whichever template sorted first, rather than the flagship. */
const TEMPLATE_ORDER: string[] = TEMPLATES.map((t) => t.key)

/** Static fallbacks merged into live rows: badges and taglines the API has no
 *  field for, keyed by template_type. */
const STATIC_BY_KEY: Record<string, Template> = Object.fromEntries(
  TEMPLATES.map((t) => [t.key, t])
)

/**
 * Builds the landing page's live Template list from `/api/public/landing`'s
 * enabled-only template array.
 *
 * Name, description and credit cost come from the API (an admin can change any
 * of them without a redeploy). Card art, tagline, display order and the
 * "Flagship" badge are frontend concerns and are merged in from the static list.
 */
export function buildTemplatesFromApi(items: PublicApiTemplate[]): Template[] {
  const built = items.map((item) => ({
    key: item.key,
    tagline: TEMPLATE_TAGLINES[item.key] ?? item.description.split(".")[0],
    name: item.name,
    description: item.description,
    credits: item.credits,
    icon: item.icon in TEMPLATE_ICONS_BY_SLUG ? item.icon : "wand2",
    image: templateImage(item.key),
    // A live "Trending" flag wins; otherwise keep the static badge (Flagship).
    badge: item.badge ?? STATIC_BY_KEY[item.key]?.badge,
  }))

  // Known templates in canonical order; anything the backend adds later that we
  // have no entry for is appended rather than dropped.
  return built.sort((a, b) => {
    const ia = TEMPLATE_ORDER.indexOf(a.key)
    const ib = TEMPLATE_ORDER.indexOf(b.key)
    return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib)
  })
}

export type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

/** Real, shipped capabilities — no vapourware. */
export const FEATURES: Feature[] = [
  {
    icon: Mic,
    title: "Studio voiceover, included",
    description: "Natural AI narration on every video — no per-word fees, ever.",
  },
  {
    icon: Captions,
    title: "Karaoke captions",
    description: "Word-by-word animated captions, burned in automatically.",
  },
  {
    icon: Music,
    title: "Mood-matched music",
    description: "Background tracks picked to fit the mood of each scene.",
  },
  {
    icon: ImageIcon,
    title: "AI visuals & b-roll",
    description: "Generated images and ambient backgrounds fill every gap.",
  },
  {
    icon: Smartphone,
    title: "Shorts-first, not shorts-only",
    description: "Built for 9:16 Shorts, Reels & TikTok — and exports 16:9 widescreen for YouTube.",
  },
  {
    icon: Zap,
    title: "Fresh credits daily",
    description: "Your balance refills every day. Make something every single day.",
  },
]

export type Step = {
  n: string
  title: string
  description: string
  icon: LucideIcon
}

export const STEPS: Step[] = [
  {
    n: "01",
    title: "Pick a template & add your source",
    description: "A script, a prompt, or a YouTube link. That's all we need to start.",
    icon: PenLine,
  },
  {
    n: "02",
    title: "AI writes, voices & edits it",
    description: "Scripting, voiceover, captions, music and cuts — all automatic.",
    icon: Wand2,
  },
  {
    n: "03",
    title: "Download your ready-to-post short",
    description: "A finished 9:16 video, exported and ready to upload.",
    icon: Download,
  },
]

export type Testimonial = {
  quote: string
  name: string
  role: string
  avatar: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I run three faceless channels and this is the only reason I can post daily. Script to upload in one sitting.",
    name: "Maya Ortiz",
    role: "Faceless creator",
    avatar: "MO",
  },
  {
    quote:
      "The gameplay clipper pays for itself. It finds the moment I'd have scrubbed 20 minutes to catch.",
    name: "Devin Cole",
    role: "Gaming channel",
    avatar: "DC",
  },
  {
    quote:
      "Voiceover and captions used to eat my whole afternoon. Now they're done before my coffee's cold.",
    name: "Priya Nair",
    role: "Educator",
    avatar: "PN",
  },
  {
    quote:
      "Compilations that used to take an editor a full day — I make one on my phone during lunch.",
    name: "Sam Whitfield",
    role: "Agency owner",
    avatar: "SW",
  },
]

export type Tier = {
  name: string
  dailyCredits: number
  monthly: number
  description: string
  features: string[]
  popular: boolean
}

/** Mirrors the real plan ladder (PlanSeeder / billing). */
export const TIERS: Tier[] = [
  {
    name: "Starter",
    dailyCredits: 100,
    monthly: 10,
    description: "For getting started with daily content.",
    features: [
      "100 credits per day",
      "All video templates",
      "1080p HD exports",
      "Standard render queue",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Creator",
    dailyCredits: 300,
    monthly: 15,
    description: "For creators publishing every day.",
    features: [
      "300 credits per day",
      "All video templates",
      "1080p HD exports",
      "Priority render queue",
      "Background music & captions",
      "Priority email support",
    ],
    popular: true,
  },
  {
    name: "Studio",
    dailyCredits: 1000,
    monthly: 30,
    description: "For teams and high-volume output.",
    features: [
      "1000 credits per day",
      "All video templates",
      "1080p HD exports",
      "Fastest render queue",
      "Commercial usage rights",
      "Dedicated support",
    ],
    popular: false,
  },
]

/** Yearly = 25% off the annualised monthly price. */
export const yearlyPrice = (monthly: number) => Math.round(monthly * 12 * 0.75)

export const NAV_LINKS = [
  { href: "#templates", label: "Templates" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
]

/**
 * Social profiles. Only entries with a real `href` are rendered — an icon
 * pointing at "#" is a dead link that costs crawl budget and says nothing.
 * Fill these in when the accounts exist.
 */
export const SOCIAL_LINKS: { label: string; href: string; icon: "twitter" | "instagram" | "youtube" }[] = [
  // { label: "Vreato on X", href: "https://x.com/vreato", icon: "twitter" },
  // { label: "Vreato on Instagram", href: "https://instagram.com/vreato", icon: "instagram" },
  // { label: "Vreato on YouTube", href: "https://youtube.com/@vreato", icon: "youtube" },
]

export type Stat = { value: string; label: string }

export const STATS: Stat[] = [
  { value: "7", label: "ready-made templates" },
  { value: "9:16 + 16:9", label: "shorts & widescreen" },
  { value: "100%", label: "AI voiceover & captions" },
  { value: "Daily", label: "credits that refill" },
]

/* ------------------------------------------------------------------ *
 * AI Explainer demo reel
 *
 * The landing page reserves a full 16:9 slot for a real demo of the flagship
 * template. Until a file is dropped in, the section renders a labelled
 * placeholder instead of a broken <video> — and the VideoObject structured
 * data is withheld, because schema pointing at a video that does not exist is
 * a rich-results error rather than a bonus.
 *
 * TO PUBLISH THE DEMO:
 *   1. Put the MP4 at  public/demo/ai-explainer-demo.mp4
 *      and a poster at public/demo/ai-explainer-poster.jpg  (1920x1080).
 *   2. Flip `enabled` to true below, and set `duration` / `uploadDate`.
 *   (An external URL — Cloudflare R2, YouTube MP4, a CDN — works too: just put
 *    the absolute URL in `src`.)
 * ------------------------------------------------------------------ */
export type DemoVideo = {
  /** Master switch. False -> the placeholder renders and no VideoObject is emitted. */
  enabled: boolean
  src: string
  poster: string
  title: string
  description: string
  /** ISO 8601 duration, e.g. "PT1M12S" — used by the VideoObject schema. */
  duration?: string
  /** ISO date, e.g. "2026-08-28" — required by VideoObject when enabled. */
  uploadDate?: string
}

export const DEMO_VIDEO: DemoVideo = {
  enabled: false,
  src: "/demo/ai-explainer-demo.mp4",
  poster: "/demo/ai-explainer-poster.jpg",
  title: "AI Explainer Video — a full demo, script to render",
  description:
    "Watch the AI Explainer template turn a plain script into a narrated, animated explainer: scenes are planned, layouts chosen, visuals generated, narration recorded and captions synced — with no timeline editing.",
  duration: undefined,
  uploadDate: undefined,
}

export type Faq = { q: string; a: string }

/**
 * Answers to what people actually ask before signing up. Doubles as FAQPage
 * structured data, so keep every answer factual — a rich result that overstates
 * the product is worse than no rich result.
 */
export const FAQS: Faq[] = [
  {
    q: "What does Vreato actually do?",
    a: "Vreato turns a script, a prompt or a video link into a finished, post-ready video. It writes or rewrites the script, records an AI voiceover, generates or selects the visuals, syncs word-by-word captions, adds background music, and renders the final file. There is no timeline to edit.",
  },
  {
    q: "Do I need any video editing experience?",
    a: "No. You pick a template, give it a script, a prompt or a link, and choose a few options such as voice, visual style and caption look. Everything after that is automatic, and you get a finished MP4 to download.",
  },
  {
    q: "Which template should I start with?",
    a: "Start with AI Explainer Video if you have a script or a topic you want taught clearly. Use Repurpose Video to Short or Long Video to Shorts if you already have footage. Use AI Story Short from a Prompt or AI Horror Story Short if you have only an idea and no footage at all.",
  },
  {
    q: "Can I make vertical Shorts, Reels and TikToks?",
    a: "Yes. Most templates render 9:16 vertical video sized for YouTube Shorts, Instagram Reels and TikTok. The AI Explainer template renders 16:9 widescreen and can additionally export 9:16 and 1:1 versions of the same video in one job.",
  },
  {
    q: "Is the voiceover and captioning included?",
    a: "Yes. AI narration and word-by-word karaoke captions are part of every template at no extra per-word cost. Background music is included too, and can be matched to the mood of the video automatically.",
  },
  {
    q: "How does pricing work?",
    a: "Every plan gives you a credit balance that refills daily, and each render costs a set number of credits depending on how expensive the template is to run. If a render fails, the credits are returned to your balance.",
  },
  {
    q: "How long does a video take to render?",
    a: "Most shorts finish in a few minutes. Longer explainers with many AI-generated visuals take longer, and higher plans get a faster place in the render queue. You can leave the page — the dashboard tells you when it is done.",
  },
  {
    q: "Can I edit the video before it renders?",
    a: "With the AI Explainer template, yes. You get a storyboard you can review scene by scene: rewrite narration, change text, swap or regenerate a scene's image, or ask the AI to rebuild specific cards before you render.",
  },
]

/** Marketing links used in the hero / nav / CTAs. */
export const LINKS = {
  start: "/register",
  signIn: "/login",
  app: "/dashboard",
  pricing: "/dashboard/billing",
  templates: "#templates",
}
