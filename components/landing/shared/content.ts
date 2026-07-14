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
  badge?: string
}

/** The real templates the product ships (see config/credits.php). */
export const TEMPLATES: Template[] = [
  {
    key: "ai_explainer_video",
    name: "AI Explainer Videos",
    tagline: "Script → narrated storyboard",
    description:
      "Turn a script into a narrated, animated explainer with AI b-roll, captions and background music.",
    credits: 6,
    icon: "wand2",
    badge: "Flagship",
  },
  {
    key: "yt_automation_short",
    name: "YouTube Automation Shorts",
    tagline: "Topic → faceless short",
    description:
      "Drop a topic or a long video and get a fully scripted, voiced, captioned faceless short.",
    credits: 3,
    icon: "youtube",
  },
  {
    key: "yt_gameplay_short",
    name: "Gameplay Clips",
    tagline: "Long gameplay → best moment",
    description:
      "Pull the single best moment from a gameplay video, auto-captioned and cropped to 9:16.",
    credits: 2,
    icon: "gamepad2",
  },
  {
    key: "yt_compilation_short",
    name: "Moments Compilation",
    tagline: "A few clips → one countdown",
    description:
      "Merge 2–3 videos into one themed countdown compilation with AI commentary and captions.",
    credits: 3,
    icon: "layers",
  },
  {
    key: "ai_horror_shorts",
    name: "AI Horror Shorts",
    tagline: "Prompt → chilling story",
    description:
      "Generate a narrated horror story with eerie AI visuals and atmospheric ambience.",
    credits: 5,
    icon: "ghost",
  },
  {
    key: "ai_image_based_shorts",
    name: "AI Image Shorts",
    tagline: "Prompt → image listicle",
    description:
      "Turn a prompt into a listicle-style short built from AI-generated images and voiceover.",
    credits: 5,
    icon: "images",
  },
  {
    key: "ranking_moments_short",
    name: "Top Moments Ranking",
    tagline: "One video → countdown ranking",
    description:
      "Turn one video into a countdown ranking short with star ratings, a colorful rank rail and bold captions.",
    credits: 3,
    icon: "trophy",
  },
]

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

/** Builds the landing page's live Template list from `/api/public/landing`'s enabled-only template array. */
export function buildTemplatesFromApi(items: PublicApiTemplate[]): Template[] {
  return items.map((item) => ({
    key: item.key,
    name: item.name,
    tagline: TEMPLATE_TAGLINES[item.key] ?? item.description.split(".")[0],
    description: item.description,
    credits: item.credits,
    icon: item.icon in TEMPLATE_ICONS_BY_SLUG ? item.icon : "wand2",
    badge: item.badge ?? undefined,
  }))
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
    title: "Vertical-native",
    description: "9:16 output, ready for Shorts, Reels and TikTok.",
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
    monthly: 5,
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
    monthly: 10,
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
    monthly: 20,
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
]

export type Stat = { value: string; label: string }

export const STATS: Stat[] = [
  { value: "6", label: "ready-made templates" },
  { value: "9:16", label: "vertical-native exports" },
  { value: "100%", label: "AI voiceover & captions" },
  { value: "Daily", label: "credits that refill" },
]

/** Marketing links used in the hero / nav / CTAs. */
export const LINKS = {
  start: "/register",
  signIn: "/login",
  app: "/dashboard",
  pricing: "/dashboard/billing",
  templates: "#templates",
}
