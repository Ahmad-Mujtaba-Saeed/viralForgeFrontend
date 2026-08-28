import type { Metadata } from 'next'

/**
 * Single source of truth for every SEO surface: canonical URLs, titles,
 * descriptions, social cards and JSON-LD.
 *
 * The site is a static export, so nothing here can be computed per request —
 * every absolute URL is built from NEXT_PUBLIC_SITE_URL, which is baked in at
 * build time. Point that at the real production origin before shipping; the
 * default only keeps local builds and previews from emitting relative
 * canonicals (which crawlers reject).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://vreato.com'
).replace(/\/$/, '')

export const SITE = {
  name: 'Vreato',
  /** Used as the `title.template` suffix and in JSON-LD. */
  legalName: 'Vreato',
  url: SITE_URL,
  /** ~155 chars: the length Google renders before truncating a description. */
  description:
    'Vreato turns a script, a prompt or a YouTube link into a finished video — AI scripting, studio voiceover, karaoke captions, music and the edit, rendered for you.',
  tagline: 'AI video, start to finish',
  locale: 'en_US',
  twitter: '@vreato',
  ogImage: `${SITE_URL}/og/og-default.jpg`,
  ogImageAlt:
    'Vreato — AI video, start to finish. Script to post-ready short.',
} as const

/** Terms real people search for. Kept honest: every one maps to a shipped template. */
export const SITE_KEYWORDS = [
  'AI video generator',
  'AI explainer video maker',
  'faceless YouTube shorts generator',
  'text to video AI',
  'script to video',
  'AI voiceover video maker',
  'automatic subtitles video',
  'YouTube shorts maker',
  'TikTok video generator',
  'Instagram Reels maker',
  'video repurposing tool',
  'AI horror story video',
  'gameplay clips generator',
  'compilation video maker',
]

type PageSeo = {
  title: string
  description: string
  /** Site-root-relative path, e.g. "/login". */
  path: string
  /** Login walls, app screens and transactional pages must stay out of the index. */
  noindex?: boolean
  image?: string
  imageAlt?: string
}

/**
 * Builds a complete, self-consistent Metadata object for one page:
 * canonical + Open Graph + Twitter card, all absolute.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
  image = SITE.ogImage,
  imageAlt = SITE.ogImageAlt,
}: PageSeo): Metadata {
  const url = `${SITE_URL}${path === '/' ? '' : path}`

  // Next's `title.template` only rewrites the <title> tag — Open Graph and
  // Twitter titles are passed through verbatim. Brand them here so a shared
  // link never reads as a bare "Sign In".
  const socialTitle = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      locale: SITE.locale,
      url,
      title: socialTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE.twitter,
      creator: SITE.twitter,
      title: socialTitle,
      description,
      images: [image],
    },
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  }
}

/* ------------------------------ JSON-LD ------------------------------ *
 * Emitted as <script type="application/ld+json"> via the JsonLd component.
 * Each builder returns a plain object so callers can compose a @graph.
 * -------------------------------------------------------------------- */

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/brand/mark-512.png`,
      width: 512,
      height: 512,
    },
    description: SITE.description,
  }
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE.name,
    description: SITE.description,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en',
  }
}

/**
 * The product itself. `offers` mirrors the real plan ladder so the rich result
 * never advertises a price the billing page does not charge.
 */
export function softwareApplicationSchema(
  tiers: { name: string; monthly: number; description: string }[]
) {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: SITE.name,
    applicationCategory: 'MultimediaApplication',
    applicationSubCategory: 'Video Editing Software',
    operatingSystem: 'Web browser',
    url: SITE_URL,
    description: SITE.description,
    screenshot: SITE.ogImage,
    featureList: [
      'AI script writing',
      'AI studio voiceover',
      'Word-by-word karaoke captions',
      'Mood-matched background music',
      'AI generated visuals and b-roll',
      '9:16 vertical and 16:9 widescreen export',
    ],
    offers: tiers.map((t) => ({
      '@type': 'Offer',
      name: `${t.name} plan`,
      description: t.description,
      price: t.monthly.toFixed(2),
      priceCurrency: 'USD',
      category: 'subscription',
      url: `${SITE_URL}/#pricing`,
    })),
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

/** The template catalogue, so search engines can surface individual templates. */
export function templateListSchema(
  templates: { key: string; name: string; description: string; image?: string }[],
  path = '/'
) {
  return {
    '@type': 'ItemList',
    '@id': `${SITE_URL}${path === '/' ? '' : path}#templates`,
    name: 'Vreato video templates',
    numberOfItems: templates.length,
    itemListElement: templates.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: t.name,
        description: t.description,
        url: `${SITE_URL}/#templates`,
        ...(t.image ? { image: `${SITE_URL}${t.image}` } : {}),
      },
    })),
  }
}

/**
 * `path` scopes the node id to the page emitting it — several pages carry their
 * own FAQ block, and two nodes sharing one @id is a structured-data conflict.
 */
export function faqSchema(faqs: { q: string; a: string }[], path = '/') {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}${path === '/' ? '' : path}#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

/**
 * The AI Explainer demo reel. Only emitted once a real video URL is configured —
 * a VideoObject pointing at nothing is a structured-data error, not a bonus.
 */
export function videoSchema(video: {
  name: string
  description: string
  thumbnailUrl: string
  contentUrl: string
  uploadDate: string
  duration?: string
}) {
  return {
    '@type': 'VideoObject',
    '@id': `${SITE_URL}/#demo-video`,
    name: video.name,
    description: video.description,
    thumbnailUrl: [`${SITE_URL}${video.thumbnailUrl}`],
    contentUrl: video.contentUrl.startsWith('http')
      ? video.contentUrl
      : `${SITE_URL}${video.contentUrl}`,
    uploadDate: video.uploadDate,
    ...(video.duration ? { duration: video.duration } : {}),
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

/** Wraps any set of node objects into one @graph document. */
export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes }
}

/**
 * The visible breadcrumb trail, restated for search engines. Google shows this
 * as the path under a result instead of the raw URL, and it is one of the
 * signals that tells it the site has a real hierarchy rather than one page.
 *
 * `items` must match the on-page <Breadcrumbs> exactly, last item = this page.
 */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === '/' ? '' : item.path}`,
    })),
  }
}

/** One template, as a thing in its own right rather than a list entry. */
export function templateSchema(t: {
  name: string
  description: string
  path: string
  image?: string
}) {
  return {
    '@type': 'CreativeWork',
    '@id': `${SITE_URL}${t.path}#template`,
    name: t.name,
    description: t.description,
    url: `${SITE_URL}${t.path}`,
    ...(t.image ? { image: `${SITE_URL}${t.image}` } : {}),
    isPartOf: { '@id': `${SITE_URL}/#website` },
    provider: { '@id': `${SITE_URL}/#organization` },
  }
}
